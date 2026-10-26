package com.ledger.diary.controller;

import com.ledger.diary.dto.BackupDtos.Backup;
import com.ledger.diary.dto.BackupDtos.BackupEntry;
import com.ledger.diary.dto.BackupDtos.Settings;
import com.ledger.diary.dto.Message;
import com.ledger.diary.entity.User;
import com.ledger.diary.entity.UserSetting;
import com.ledger.diary.service.EntryService;
import com.ledger.diary.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private final EntryService entryService;
    private final UserService userService;

    public BackupController(EntryService entryService, UserService userService) {
        this.entryService = entryService;
        this.userService = userService;
    }

    @GetMapping
    public Backup downloadBackup() {
        User user = userService.current();
        UserSetting s = userService.getSettings(user);

        List<BackupEntry> list = entryService.fullList().stream()
                .map(e -> new BackupEntry(
                        e.getDate(),
                        e.getTitle(),
                        e.getMood(),
                        e.getCategory(),
                        e.getContent(),
                        e.getImageData(),
                        e.isFavourite(),
                        e.isLocked()
                ))
                .toList();

        return new Backup(
                "1.0",
                Instant.now().toString(),
                new Settings(s.getTheme(), s.isReminders(), s.getReminderTime()),
                list
        );
    }

    @PostMapping("/restore")
    public ResponseEntity<Message> restoreBackup(@RequestBody Backup backup) {
        if (backup == null || backup.entries() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid backup file: entries array missing");
        }

        entryService.restore(backup.entries());

        if (backup.settings() != null) {
            User user = userService.current();
            String theme = backup.settings().theme() != null ? backup.settings().theme() : "light";
            String reminderTime = backup.settings().reminderTime() != null ? backup.settings().reminderTime() : "21:00";
            userService.updateSettings(user, theme, backup.settings().reminders(), reminderTime);
        }

        return ResponseEntity.ok(new Message("Backup restored successfully."));
    }
}
