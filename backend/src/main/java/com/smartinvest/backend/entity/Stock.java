package com.smartinvest.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock")
public class Stock {
    @Id
    @Column(length = 32)
    private String symbol;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "exchange_code", length = 32)
    private String exchangeCode;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Stock() {
    }

    public Stock(String symbol, String companyName, String exchangeCode, boolean active) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.exchangeCode = exchangeCode;
        this.active = active;
    }

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        updatedAt = Instant.now();
    }

    public String getSymbol() {
        return symbol;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getExchangeCode() {
        return exchangeCode;
    }

    public boolean isActive() {
        return active;
    }
}
