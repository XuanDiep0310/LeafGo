-- =============================================
-- LEAFGO DATABASE SCHEMA 
-- =============================================

USE [MASTER]
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'LeafGoDB')
BEGIN
    CREATE DATABASE LeafGoDB;
END
GO

USE LeafGoDB
GO


-- 1. USERS TABLE (Quản lý tất cả user)
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('User', 'Driver', 'Admin')),
    Avatar NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0, -- Soft delete
    IsOnline BIT NOT NULL DEFAULT 0, -- Cho Driver
    ResetPasswordToken NVARCHAR(500) NULL,
    ResetPasswordExpiry DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    INDEX IX_Users_Email (Email),
    INDEX IX_Users_Role (Role),
    INDEX IX_Users_IsOnline (IsOnline),
    INDEX IX_Users_IsDeleted (IsDeleted)
);

-- 2. REFRESH TOKENS TABLE (Quản lý refresh tokens)
CREATE TABLE RefreshTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedByIp NVARCHAR(50) NULL,
    RevokedAt DATETIME2 NULL,
    RevokedByIp NVARCHAR(50) NULL,
    ReplacedByToken NVARCHAR(500) NULL, -- Token mới thay thế token này
    IsExpired AS (CASE WHEN GETDATE() >= ExpiresAt THEN 1 ELSE 0 END),
    IsRevoked AS (CASE WHEN RevokedAt IS NOT NULL THEN 1 ELSE 0 END),
    IsActive AS (CASE WHEN RevokedAt IS NULL AND GETDATE() < ExpiresAt THEN 1 ELSE 0 END),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_RefreshTokens_Token (Token),
    INDEX IX_RefreshTokens_UserId (UserId)
);

-- 3. VEHICLE TYPES TABLE (Loại xe & giá cước)
CREATE TABLE VehicleTypes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL, -- Xe máy, Ô tô 4 chỗ, Ô tô 7 chỗ
    BasePrice DECIMAL(18,2) NOT NULL, -- Giá cơ bản
    PricePerKm DECIMAL(18,2) NOT NULL, -- Giá mỗi km
    Description NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- 4. DRIVER VEHICLES TABLE (Thông tin xe của tài xế)
CREATE TABLE DriverVehicles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DriverId UNIQUEIDENTIFIER NOT NULL,
    VehicleTypeId UNIQUEIDENTIFIER NOT NULL,
    LicensePlate NVARCHAR(20) NOT NULL UNIQUE,
    VehicleBrand NVARCHAR(100) NULL, -- Honda, Toyota...
    VehicleModel NVARCHAR(100) NULL,
    VehicleColor NVARCHAR(50) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (DriverId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (VehicleTypeId) REFERENCES VehicleTypes(Id) ON DELETE NO ACTION,
    INDEX IX_DriverVehicles_DriverId (DriverId)
);

-- 5. RIDES TABLE (Chuyến đi - Bảng quan trọng nhất)
CREATE TABLE Rides (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    DriverId UNIQUEIDENTIFIER NULL, -- NULL khi chưa có driver nhận
    VehicleTypeId UNIQUEIDENTIFIER NOT NULL,
    
    -- Thông tin user & driver (snapshot tại thời điểm tạo chuyến)
    UserName NVARCHAR(255) NOT NULL, -- Snapshot
    UserPhone NVARCHAR(20) NOT NULL, -- Snapshot
    DriverName NVARCHAR(255) NULL, -- Snapshot khi driver nhận
    DriverPhone NVARCHAR(20) NULL, -- Snapshot khi driver nhận
    
    -- Thông tin địa điểm
    PickupAddress NVARCHAR(500) NOT NULL,
    PickupLatitude DECIMAL(10,8) NOT NULL,
    PickupLongitude DECIMAL(11,8) NOT NULL,
    DestinationAddress NVARCHAR(500) NOT NULL,
    DestinationLatitude DECIMAL(10,8) NOT NULL,
    DestinationLongitude DECIMAL(11,8) NOT NULL,
    
    -- Thông tin giá & khoảng cách
    Distance DECIMAL(10,2) NOT NULL, -- km
    EstimatedDuration INT NOT NULL, -- phút
    EstimatedPrice DECIMAL(18,2) NOT NULL,
    FinalPrice DECIMAL(18,2) NULL, -- Giá cuối cùng (sau khi hoàn thành)
    
    -- Trạng thái chuyến đi
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK (Status IN ('Pending', 'Accepted', 'DriverArriving', 'DriverArrived', 
                         'InProgress', 'Completed', 'Cancelled')),
    
    -- Thời gian
    RequestedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    AcceptedAt DATETIME2 NULL,
    DriverArrivingAt DATETIME2 NULL,
    DriverArrivedAt DATETIME2 NULL,
    StartedAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    CancelledAt DATETIME2 NULL,
    
    CancellationReason NVARCHAR(500) NULL,
    CancelledBy NVARCHAR(20) NULL, -- 'User' hoặc 'Driver'
    Notes NVARCHAR(1000) NULL,
    
    -- Version cho Optimistic Concurrency Control (xử lý race condition)
    Version ROWVERSION,
    
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    -- Foreign Keys với NO ACTION để giữ lịch sử
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION,
    FOREIGN KEY (DriverId) REFERENCES Users(Id) ON DELETE NO ACTION,
    FOREIGN KEY (VehicleTypeId) REFERENCES VehicleTypes(Id) ON DELETE NO ACTION,
    
    INDEX IX_Rides_UserId (UserId),
    INDEX IX_Rides_DriverId (DriverId),
    INDEX IX_Rides_Status (Status),
    INDEX IX_Rides_RequestedAt (RequestedAt DESC),
    INDEX IX_Rides_UserStatus (UserId, Status), -- Tìm chuyến active của user
    INDEX IX_Rides_DriverStatus (DriverId, Status) -- Tìm chuyến active của driver
);

-- 6. RATINGS TABLE (Đánh giá)
CREATE TABLE Ratings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RideId UNIQUEIDENTIFIER NOT NULL UNIQUE, -- Mỗi chuyến chỉ 1 đánh giá
    UserId UNIQUEIDENTIFIER NOT NULL,
    DriverId UNIQUEIDENTIFIER NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (RideId) REFERENCES Rides(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION,
    FOREIGN KEY (DriverId) REFERENCES Users(Id) ON DELETE NO ACTION,
    INDEX IX_Ratings_DriverId (DriverId),
    INDEX IX_Ratings_RideId (RideId)
);

-- 7. DRIVER LOCATIONS TABLE (Vị trí tài xế realtime - dùng với Redis)
-- Bảng này backup vị trí, Redis làm chính
CREATE TABLE DriverLocations (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DriverId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8) NOT NULL,
    LastUpdated DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (DriverId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_DriverLocations_LastUpdated (LastUpdated)
);

-- 8. NOTIFICATIONS TABLE (Thông báo - optional)
CREATE TABLE Notifications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(1000) NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- RideRequest, RideAccepted, RideCompleted...
    IsRead BIT NOT NULL DEFAULT 0,
    ReferenceId UNIQUEIDENTIFIER NULL, -- RideId nếu liên quan đến chuyến
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX IX_Notifications_UserId (UserId),
    INDEX IX_Notifications_IsRead (IsRead)
);

-- =============================================
-- STORED PROCEDURES FOR RACE CONDITION HANDLING
-- =============================================

-- SP: User tạo chuyến (kiểm tra có chuyến active không)
GO
CREATE PROCEDURE sp_CreateRide
    @UserId UNIQUEIDENTIFIER,
    @VehicleTypeId UNIQUEIDENTIFIER,
    @UserName NVARCHAR(255),
    @UserPhone NVARCHAR(20),
    @PickupAddress NVARCHAR(500),
    @PickupLat DECIMAL(10,8),
    @PickupLng DECIMAL(11,8),
    @DestinationAddress NVARCHAR(500),
    @DestinationLat DECIMAL(10,8),
    @DestinationLng DECIMAL(11,8),
    @Distance DECIMAL(10,2),
    @Duration INT,
    @EstimatedPrice DECIMAL(18,2),
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NewRideId UNIQUEIDENTIFIER = NEWID();
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra user có chuyến active không (with lock)
        IF EXISTS (
            SELECT 1 FROM Rides WITH (UPDLOCK, HOLDLOCK)
            WHERE UserId = @UserId 
            AND Status IN ('Pending', 'Accepted', 'DriverArriving', 'DriverArrived', 'InProgress')
        )
        BEGIN
            THROW 50001, 'User already has an active ride', 1;
        END
        
        -- Tạo chuyến mới
        INSERT INTO Rides (
            Id, UserId, VehicleTypeId, UserName, UserPhone,
            PickupAddress, PickupLatitude, PickupLongitude,
            DestinationAddress, DestinationLatitude, DestinationLongitude,
            Distance, EstimatedDuration, EstimatedPrice, Notes, Status
        )
        VALUES (
            @NewRideId, @UserId, @VehicleTypeId, @UserName, @UserPhone,
            @PickupAddress, @PickupLat, @PickupLng,
            @DestinationAddress, @DestinationLat, @DestinationLng,
            @Distance, @Duration, @EstimatedPrice, @Notes, 'Pending'
        );
        
        -- Trả về RideId và Version
        SELECT 
            @NewRideId AS RideId,
            Version
        FROM Rides 
        WHERE Id = @NewRideId;
        
        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- SP: Driver nhận chuyến (xử lý race condition)
CREATE PROCEDURE sp_AcceptRide
    @RideId UNIQUEIDENTIFIER,
    @DriverId UNIQUEIDENTIFIER,
    @DriverName NVARCHAR(255),
    @DriverPhone NVARCHAR(20),
    @Version BINARY(8)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra driver có chuyến active không (with lock)
        IF EXISTS (
            SELECT 1 FROM Rides WITH (UPDLOCK, HOLDLOCK)
            WHERE DriverId = @DriverId 
            AND Status IN ('Accepted', 'DriverArriving', 'DriverArrived', 'InProgress')
        )
        BEGIN
            THROW 50002, 'Driver already has an active ride', 1;
        END
        
        -- Nhận chuyến (dùng Version để tránh race condition)
        UPDATE Rides WITH (UPDLOCK)
        SET DriverId = @DriverId,
            DriverName = @DriverName,
            DriverPhone = @DriverPhone,
            Status = 'Accepted',
            AcceptedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE Id = @RideId 
        AND Status = 'Pending'
        AND DriverId IS NULL
        AND Version = @Version; -- Optimistic Concurrency
        
        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50003, 'Ride already accepted by another driver or version mismatch', 1;
        END
        
        -- Trả về ride info với version mới
        SELECT 
            Id,
            UserId,
            DriverId,
            Status,
            Version
        FROM Rides 
        WHERE Id = @RideId;
        
        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- SP: Cập nhật trạng thái chuyến (Driver)
CREATE PROCEDURE sp_UpdateRideStatus
    @RideId UNIQUEIDENTIFIER,
    @DriverId UNIQUEIDENTIFIER,
    @NewStatus NVARCHAR(50),
    @FinalPrice DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra quyền và trạng thái hợp lệ
        IF NOT EXISTS (
            SELECT 1 FROM Rides
            WHERE Id = @RideId 
            AND DriverId = @DriverId
        )
        BEGIN
            THROW 50004, 'Unauthorized or ride not found', 1;
        END
        
        -- Update status với timestamp tương ứng
        UPDATE Rides
        SET Status = @NewStatus,
            DriverArrivingAt = CASE WHEN @NewStatus = 'DriverArriving' THEN GETDATE() ELSE DriverArrivingAt END,
            DriverArrivedAt = CASE WHEN @NewStatus = 'DriverArrived' THEN GETDATE() ELSE DriverArrivedAt END,
            StartedAt = CASE WHEN @NewStatus = 'InProgress' THEN GETDATE() ELSE StartedAt END,
            CompletedAt = CASE WHEN @NewStatus = 'Completed' THEN GETDATE() ELSE CompletedAt END,
            FinalPrice = CASE WHEN @NewStatus = 'Completed' THEN ISNULL(@FinalPrice, EstimatedPrice) ELSE FinalPrice END,
            UpdatedAt = GETDATE()
        WHERE Id = @RideId;
        
        -- Trả về ride info
        SELECT 
            Id,
            Status,
            CompletedAt,
            FinalPrice
        FROM Rides 
        WHERE Id = @RideId;
        
        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- View: Thống kê driver
CREATE VIEW vw_DriverStatistics AS
SELECT 
    d.Id AS DriverId,
    d.FullName,
    d.PhoneNumber,
    d.Avatar,
    COUNT(r.Id) AS TotalRides,
    COALESCE(AVG(CAST(rat.Rating AS FLOAT)), 0) AS AverageRating,
    COALESCE(SUM(r.FinalPrice), 0) AS TotalEarnings,
    COUNT(rat.Id) AS TotalReviews
FROM Users d
LEFT JOIN Rides r ON d.Id = r.DriverId AND r.Status = 'Completed'
LEFT JOIN Ratings rat ON d.Id = rat.DriverId
WHERE d.Role = 'Driver' AND d.IsDeleted = 0
GROUP BY d.Id, d.FullName, d.PhoneNumber, d.Avatar;
GO

-- View: Thống kê chung
CREATE VIEW vw_SystemStatistics AS
SELECT 
    (SELECT COUNT(*) FROM Users WHERE Role = 'User' AND IsActive = 1 AND IsDeleted = 0) AS TotalUsers,
    (SELECT COUNT(*) FROM Users WHERE Role = 'Driver' AND IsActive = 1 AND IsDeleted = 0) AS TotalDrivers,
    (SELECT COUNT(*) FROM Rides WHERE Status = 'Completed') AS TotalCompletedRides,
    (SELECT COUNT(*) FROM Rides WHERE Status = 'Pending') AS TotalPendingRides,
    (SELECT COALESCE(SUM(FinalPrice), 0) FROM Rides WHERE Status = 'Completed') AS TotalRevenue,
    (SELECT COUNT(*) FROM Users WHERE Role = 'Driver' AND IsOnline = 1 AND IsDeleted = 0) AS OnlineDrivers;
GO

-- =============================================
-- SEED DATA (Optional)
-- =============================================

-- Insert default vehicle types
INSERT INTO VehicleTypes (Id, Name, BasePrice, PricePerKm, Description, IsActive)
VALUES 
    (NEWID(), N'Xe máy', 10000, 3000, N'Xe máy 2 bánh', 1),
    (NEWID(), N'Ô tô 4 chỗ', 15000, 5000, N'Xe ô tô 4 chỗ tiện nghi', 1),
    (NEWID(), N'Ô tô 7 chỗ', 20000, 7000, N'Xe ô tô 7 chỗ rộng rãi', 1);
GO

-- Insert admin account (password: Admin@123)
INSERT INTO Users (Id, Email, PasswordHash, FullName, PhoneNumber, Role, IsActive)
VALUES (
    NEWID(), 
    'admin@leafgo.com', 
    '$2a$12$qYjYbkdPc8JJ7D4ghTXEtunMlJv5eCkM3sZAwuGOj4UQRFgq.upv.', -- BCrypt hash
    N'Administrator',
    '0900000000',
    'Admin',
    1
);
GO