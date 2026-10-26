package com.ledger.diary.service;

import com.ledger.diary.dto.BackupDtos.BackupEntry;
import com.ledger.diary.dto.EntryDtos.EntryRequest;
import com.ledger.diary.dto.EntryDtos.EntryResponse;
import com.ledger.diary.entity.DiaryEntry;
import com.ledger.diary.entity.User;
import com.ledger.diary.repository.DiaryEntryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EntryService {

    private final DiaryEntryRepository entryRepository;
    private final UserService userService;

    public EntryService(DiaryEntryRepository entryRepository, UserService userService) {
        this.entryRepository = entryRepository;
        this.userService = userService;
    }

    public List<EntryResponse> list() {
        User user = userService.current();
        return entryRepository.findAllByUserOrderByDateDescCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<DiaryEntry> fullList() {
        return entryRepository.findAllByUserOrderByDateDescCreatedAtDesc(userService.current());
    }

    public EntryResponse get(Long id, boolean unlocked) {
        DiaryEntry entry = owned(id);
        return toResponse(entry, unlocked);
    }

    @Transactional
    public EntryResponse save(EntryRequest request, Long id) {
        User user = userService.current();
        DiaryEntry entry = (id == null) ? new DiaryEntry() : owned(id);

        entry.setUser(user);
        entry.setDate(request.date());
        entry.setTitle(request.title().trim());
        entry.setMood(request.mood());
        entry.setCategory(request.category());
        entry.setContent(request.content());
        entry.setImageData(request.image());
        entry.setFavourite(request.favourite());
        entry.setLocked(request.locked());

        DiaryEntry saved = entryRepository.save(entry);
        return toResponse(saved, !saved.isLocked());
    }

    @Transactional
    public void delete(Long id) {
        DiaryEntry entry = owned(id);
        entryRepository.delete(entry);
    }

    @Transactional
    public EntryResponse favourite(Long id) {
        DiaryEntry entry = owned(id);
        entry.setFavourite(!entry.isFavourite());
        DiaryEntry saved = entryRepository.save(entry);
        return toResponse(saved, !saved.isLocked());
    }

    public EntryResponse unlock(Long id) {
        return get(id, true);
    }

    public DiaryEntry owned(Long id) {
        User user = userService.current();
        return entryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
    }

    private EntryResponse toResponse(DiaryEntry entry) {
        return toResponse(entry, false);
    }

    private EntryResponse toResponse(DiaryEntry entry, boolean unlocked) {
        boolean exposeContent = !entry.isLocked() || unlocked;
        return new EntryResponse(
                entry.getId(),
                entry.getDate(),
                entry.getTitle(),
                entry.getMood(),
                entry.getCategory(),
                exposeContent ? entry.getContent() : null,
                exposeContent ? entry.getImageData() : null,
                entry.isFavourite(),
                entry.isLocked(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }

    @Transactional
    public void restore(List<BackupEntry> entries) {
        User user = userService.current();
        entryRepository.deleteByUser(user);
        for (BackupEntry be : entries) {
            DiaryEntry entry = new DiaryEntry();
            entry.setUser(user);
            entry.setDate(be.date());
            entry.setTitle(be.title() != null ? be.title() : "Untitled");
            entry.setMood(be.mood() != null ? be.mood() : "Calm");
            entry.setCategory(be.category() != null ? be.category() : "Journal");
            entry.setContent(be.content() != null ? be.content() : "");
            entry.setImageData(be.image());
            entry.setFavourite(be.favourite());
            entry.setLocked(be.locked());
            entryRepository.save(entry);
        }
    }
}
