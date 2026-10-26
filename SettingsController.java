package com.ledger.diary.controller;

import com.ledger.diary.dto.Message;
import com.ledger.diary.dto.SettingsDtos.PasswordChangeRequest;
import com.ledger.diary.dto.SettingsDtos.SettingsRequest;
import com.ledger.diary.dto.SettingsDtos.SettingsResponse;
import com.ledger.diary.entity.User;
import com.ledger.diary.entity.UserSetting;
import com.ledger.diary.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final UserService userService;

    public SettingsController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public SettingsResponse getSettings() {
        User user = userService.current();
        UserSetting settings = userService.getSettings(user);
        return new SettingsResponse(settings.getTheme(), settings.isReminders(), settings.getReminderTime());
    }

    @PutMapping
    public SettingsResponse updateSettings(@Valid @RequestBody SettingsRequest request) {
        User user = userService.current();
        UserSetting updated = userService.updateSettings(
                user,
                request.theme(),
                request.reminders(),
                request.reminderTime()
        );
        return new SettingsResponse(updated.getTheme(), updated.isReminders(), updated.getReminderTime());
    }

    @PutMapping("/password")
    public ResponseEntity<Message> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        User user = userService.current();
        if (!userService.matches(user, request.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        userService.changePassword(user, request.newPassword());
        return ResponseEntity.ok(new Message("Password updated."));
    }
}
