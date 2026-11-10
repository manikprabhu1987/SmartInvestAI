package com.smartinvest.backend.repository;

import java.util.Optional;

import com.smartinvest.backend.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockRepository extends JpaRepository<Stock, String> {
    Optional<Stock> findBySymbolAndActiveTrue(String symbol);

    @Query("""
            select s from Stock s
            where s.active = true
              and (lower(s.symbol) like lower(concat('%', :query, '%'))
                   or lower(s.companyName) like lower(concat('%', :query, '%')))
            """)
    Page<Stock> searchActive(@Param("query") String query, Pageable pageable);
}
