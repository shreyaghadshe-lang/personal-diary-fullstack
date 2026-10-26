package com.ledger.diary.dto;

import java.time.LocalDate;
import java.util.List;

public class BackupDtos {

    public record BackupEntry(
        LocalDate date,
        String title,
        String mood,
        String category,
        String content,
        String image,
        boolean favourite,
        boolean locked
    ) {}

    public record Settings(
        String theme,
        boolean reminders,
        String reminderTime
    ) {}

    public record Backup(
        String version,
        String exportedAt,
        Settings settings,
        List<BackupEntry> entries
    ) {}
}
