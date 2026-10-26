package com.ledger.diary;

import com.ledger.diary.dto.AuthDtos.LoginRequest;
import com.ledger.diary.dto.AuthDtos.RegisterRequest;
import com.ledger.diary.dto.EntryDtos.EntryRequest;
import com.ledger.diary.dto.EntryDtos.EntryResponse;
import com.ledger.diary.dto.EntryDtos.UnlockRequest;
import com.ledger.diary.dto.SettingsDtos.SettingsRequest;
import com.ledger.diary.dto.SettingsDtos.SettingsResponse;
import com.ledger.diary.entity.DiaryEntry;
import com.ledger.diary.entity.User;
import com.ledger.diary.repository.DiaryEntryRepository;
import com.ledger.diary.repository.UserRepository;
import com.ledger.diary.service.EntryService;
import com.ledger.diary.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
public class LedgerDiaryApplicationTests {

    @Autowired
    private UserService userService;

    @Autowired
    private EntryService entryService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiaryEntryRepository diaryEntryRepository;

    @BeforeEach
    void setUp() {
        diaryEntryRepository.deleteAll();
        userRepository.deleteAll();
    }

    private void authenticateUser(String username) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(username, "n/a", List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testUserRegistrationAndBCryptHashing() {
        User user = userService.register("Alice Wonderland", "alice", "SecretPass123");
        assertNotNull(user.getId());
        assertEquals("alice", user.getUsername());
        assertNotEquals("SecretPass123", user.getPasswordHash());
        assertTrue(userService.matches(user, "SecretPass123"));
        assertFalse(userService.matches(user, "WrongPass"));
    }

    @Test
    void testDuplicateUsernameFails() {
        userService.register("Alice", "alice", "pass1");
        assertThrows(ResponseStatusException.class, () -> {
            userService.register("Alice Another", "alice", "pass2");
        });
    }

    @Test
    void testEntryCreationAndPrivacyRedaction() {
        User user = userService.register("Bob", "bob", "password123");
        authenticateUser("bob");

        EntryRequest req = new EntryRequest(
                LocalDate.of(2026, 10, 24),
                "Secret Day",
                "Calm",
                "Journal",
                "This is very private content.",
                null,
                true,
                true // locked
        );

        EntryResponse created = entryService.save(req, null);
        assertNotNull(created.id());
        assertTrue(created.locked());

        // When listing entries, private content MUST be redacted (null)
        List<EntryResponse> entries = entryService.list();
        assertEquals(1, entries.size());
        assertNull(entries.get(0).content(), "Content must be redacted for locked entries in general listing");

        // Unlocking with correct password exposes content
        EntryResponse unlocked = entryService.unlock(created.id());
        assertEquals("This is very private content.", unlocked.content());
    }

    @Test
    void testUserIsolationPreventsCrossUserAccess() {
        User alice = userService.register("Alice", "alice", "pass1234");
        authenticateUser("alice");
        EntryResponse aliceEntry = entryService.save(new EntryRequest(
                LocalDate.now(), "Alice Diary", "Happy", "Journal", "Alice secret", null, false, false
        ), null);

        User bob = userService.register("Bob", "bob", "pass5678");
        authenticateUser("bob");

        // Bob listing entries sees 0 entries
        List<EntryResponse> bobEntries = entryService.list();
        assertTrue(bobEntries.isEmpty());

        // Bob attempting to fetch Alice's entry by ID fails with 404 NOT_FOUND
        assertThrows(ResponseStatusException.class, () -> {
            entryService.get(aliceEntry.id(), false);
        });

        // Bob attempting to delete Alice's entry fails
        assertThrows(ResponseStatusException.class, () -> {
            entryService.delete(aliceEntry.id());
        });
    }

    @Test
    void testFavouriteToggle() {
        userService.register("Charlie", "charlie", "mypassword");
        authenticateUser("charlie");

        EntryResponse entry = entryService.save(new EntryRequest(
                LocalDate.now(), "Star Day", "Excited", "Gratitude", "A great day!", null, false, false
        ), null);
        assertFalse(entry.favourite());

        EntryResponse faved = entryService.favourite(entry.id());
        assertTrue(faved.favourite());

        EntryResponse unfaved = entryService.favourite(entry.id());
        assertFalse(unfaved.favourite());
    }

    @Test
    void testUserSettingsPersistence() {
        User user = userService.register("Diana", "diana", "password99");
        authenticateUser("diana");

        userService.updateSettings(user, "vintage", false, "22:30");

        var settings = userService.getSettings(user);
        assertEquals("vintage", settings.getTheme());
        assertFalse(settings.isReminders());
        assertEquals("22:30", settings.getReminderTime());
    }
}
