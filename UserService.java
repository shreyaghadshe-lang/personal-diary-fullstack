package com.ledger.diary.service;

import com.ledger.diary.entity.User;
import com.ledger.diary.entity.UserSetting;
import com.ledger.diary.repository.UserRepository;
import com.ledger.diary.repository.UserSettingRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, 
                       UserSettingRepository userSettingRepository, 
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userSettingRepository = userSettingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return userRepository.findByUsernameIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @Transactional
    public User register(String name, String username, String password) {
        if (userRepository.existsByUsernameIgnoreCase(username.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That username is already taken.");
        }
        User user = new User(name.trim(), username.trim(), passwordEncoder.encode(password));
        user = userRepository.save(user);

        UserSetting settings = new UserSetting(user);
        userSettingRepository.save(settings);

        return user;
    }

    public boolean matches(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }

    @Transactional
    public void changePassword(User user, String newPassword) {
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public UserSetting getSettings(User user) {
        return userSettingRepository.findByUser(user)
                .orElseGet(() -> userSettingRepository.save(new UserSetting(user)));
    }

    @Transactional
    public UserSetting updateSettings(User user, String theme, boolean reminders, String reminderTime) {
        UserSetting settings = getSettings(user);
        settings.setTheme(theme);
        settings.setReminders(reminders);
        settings.setReminderTime(reminderTime);
        return userSettingRepository.save(settings);
    }
}
