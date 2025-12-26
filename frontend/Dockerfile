# --- GIAI ĐOẠN 1: BUILD NODEJS ---
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments for environment variables (Vite needs them at build time)
ARG VITE_API_URL
ARG VITE_NOMINATIM_API
ARG VITE_ORS_API
ARG VITE_ORS_API_KEY

# Copy file quản lý thư viện trước (giống bên Backend để tận dụng Cache)
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Cài đặt thư viện (dùng 'ci' chuẩn hơn 'install' cho môi trường tự động hóa)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy code nguồn và chạy lệnh build của Vite
COPY . .

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_NOMINATIM_API=$VITE_NOMINATIM_API
ENV VITE_ORS_API=$VITE_ORS_API
ENV VITE_ORS_API_KEY=$VITE_ORS_API_KEY

RUN npm run build
# Kết quả lệnh này sẽ tạo ra thư mục 'dist' chứa file HTML/CSS/JS thuần.

# --- GIAI ĐOẠN 2: CHẠY WEB SERVER (NGINX) ---
FROM nginx:alpine AS final

# React là code Client-side, nó cần một Web Server để gửi file về trình duyệt.
# Nginx là lựa chọn số 1 vì siêu nhẹ và nhanh.
# Lệnh này copy thư mục 'dist' (đã build ở trên) vào thư mục phục vụ web của Nginx.
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional - create if needed)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
# Chạy Nginx ở chế độ nền (daemon off để container không bị tắt)
CMD ["nginx", "-g", "daemon off;"]