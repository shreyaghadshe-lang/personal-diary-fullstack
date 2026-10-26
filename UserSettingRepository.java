package com.ledger.diary.repository;

import com.ledger.diary.entity.User;
import com.ledger.diary.entity.UserSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSettingRepository extends JpaRepository<UserSetting, Long> {
    Optional<UserSetting> findByUser(User user);
    void deleteByUser(User user);
}
