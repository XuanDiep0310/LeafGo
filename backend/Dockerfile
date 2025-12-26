# --- GIAI ĐOẠN 1: BUILD (Dùng Image SDK nặng ~800MB) ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Bước này rất hay: Chỉ copy file .csproj trước
COPY LeafGo.API/*.csproj ./LeafGo.API/
COPY LeafGo.Application/*.csproj ./LeafGo.Application/
COPY LeafGo.Domain/*.csproj ./LeafGo.Domain/
COPY LeafGo.Infrastructure/*.csproj ./LeafGo.Infrastructure/

# Restore thư viện dựa trên file .csproj
# Lợi ích: Nếu bạn chỉ sửa code (không cài thêm thư viện mới), Docker sẽ bỏ qua bước này
# và dùng lại Cache cũ -> Tốc độ build lại siêu nhanh.
RUN dotnet restore LeafGo.API/LeafGo.API.csproj

# Bây giờ mới copy toàn bộ code vào
COPY . .

# Build code ra thư mục /app/build
WORKDIR /src/LeafGo.API
RUN dotnet build LeafGo.API.csproj -c Release -o /app/build

# --- GIAI ĐOẠN 2: PUBLISH (Vẫn dùng Image SDK) ---
FROM build AS publish
# Lệnh publish sẽ đóng gói code thành các file .dll gọn nhẹ, loại bỏ các file thừa
RUN dotnet publish LeafGo.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --- GIAI ĐOẠN 3: FINAL (Dùng Image Runtime nhẹ ~100MB) ---
# Đây là image cuối cùng sẽ được tạo ra. Nó không chứa bộ biên dịch (SDK) nên rất nhẹ và an toàn.
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Chỉ copy những file đã đóng gói (dll) từ giai đoạn 2 sang giai đoạn 3
COPY --from=publish /app/publish .

# Mở cổng 8080 và 8081 để bên ngoài có thể gọi vào
EXPOSE 8080
EXPOSE 8081

# Thiết lập biến môi trường mặc định
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Lệnh chạy chương trình khi container khởi động
ENTRYPOINT ["dotnet", "LeafGo.API.dll"]

