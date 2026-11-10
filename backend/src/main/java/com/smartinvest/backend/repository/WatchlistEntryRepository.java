package com.smartinvest.backend.repository;

import java.util.List;
import java.util.Optional;

import com.smartinvest.backend.entity.WatchlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WatchlistEntryRepository extends JpaRepository<WatchlistEntry, Long> {
    @Query("""
            select count(entry) > 0 from WatchlistEntry entry
            where entry.user.id = :userId and entry.stock.symbol = :symbol
            """)
    boolean existsByUserIdAndStockSymbol(@Param("userId") Long userId, @Param("symbol") String symbol);

    @Query("""
            select entry from WatchlistEntry entry
            join fetch entry.stock
            where entry.user.id = :userId and entry.stock.symbol = :symbol
            """)
    Optional<WatchlistEntry> findByUserIdAndStockSymbol(
            @Param("userId") Long userId, @Param("symbol") String symbol);

    @Query("""
            select entry from WatchlistEntry entry
            join fetch entry.stock
            where entry.user.id = :userId
            order by entry.createdAt desc, entry.id desc
            """)
    List<WatchlistEntry> findAllByUserIdNewestFirst(@Param("userId") Long userId);
}
