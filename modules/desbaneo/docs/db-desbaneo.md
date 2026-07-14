# Database Schema - Desbaneo

## Overview

Database documentation for the Desbaneo WhatsApp module.

## Tables

### users

- `id` (PRIMARY KEY)
- `phone` (VARCHAR, UNIQUE)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)

### bans

- `id` (PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `reason` (TEXT)
- `ban_date` (TIMESTAMP)
- `status` (ENUM: active, lifted)

### appeals

- `id` (PRIMARY KEY)
- `ban_id` (FOREIGN KEY)
- `message` (TEXT)
- `appeal_date` (TIMESTAMP)
- `reviewed` (BOOLEAN)

## Relationships

- `bans.user_id` → `users.id`
- `appeals.ban_id` → `bans.id`
