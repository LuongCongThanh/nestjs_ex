# ### ✅ TASK 23.5: Product Images & File Upload

> **Task Number:** 23.5  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Upload và quản lý hình ảnh sản phẩm

**⚠️ Note:** Task này được move lên từ Task 56 để có images ngay khi làm products

**Các bước thực hiện:**

1. **Install dependencies:**

   ```bash
   npm install @nestjs/platform-express multer
   # Choose one:
   npm install aws-sdk @aws-sdk/client-s3  # For AWS S3
   # OR
   npm install cloudinary  # For Cloudinary
   ```

2. **Generate module:**

   ```bash
   nest g module modules/uploads
   nest g service modules/uploads
   nest g controller modules/uploads
   ```

3. **Configure upload strategy (Local for dev, S3/Cloudinary for prod):**

   **Option A: Local Storage (Development)**

   - Create `public/uploads/products/` folder
   - Configure Multer disk storage
   - Serve static files

   **Option B: AWS S3 (Production Recommended)**

   - Setup AWS credentials (.env)
   - Create S3 bucket
   - Configure bucket CORS
   - Public read access policy

   **Option C: Cloudinary (Alternative)**

   - Setup Cloudinary account
   - Get API credentials
   - Configure CloudinaryModule

4. **Implement UploadService:**

   ```typescript
   - uploadImage(file: Express.Multer.File, folder: string)
   - uploadMultiple(files: Express.Multer.File[], folder: string)
   - deleteImage(fileKey: string)
   - getSignedUrl(key: string, expiresIn?: number)
   ```

5. **Create DTOs & Validators:**
   - Max file size: 5MB per image
   - Allowed types: image/jpeg, image/png, image/webp
   - Max 10 images per product
6. **Image optimization:**

   ```bash
   npm install sharp
   ```

   - Resize to multiple sizes (thumbnail, medium, large)
   - Convert to WebP for better compression
   - Strip EXIF data

7. **Endpoints:**

   ```typescript
   POST /uploads/product-image - Single image
   POST /uploads/product-images - Multiple images (max 10)
   DELETE /uploads/image/:key - Delete image (Admin only)
   ```

8. **Update Product entity:**

   ```typescript
   @Column('simple-array', { nullable: true })
   images: string[]; // Array of URLs or S3 keys

   @Column({ nullable: true })
   thumbnail: string; // Main product image
   ```

9. **Update ProductsService:**
   - Store image URLs when creating/updating product
   - Delete old images when updating
   - Cleanup images when deleting product
10. **Validation & Security:**
    - Check file mimetype
    - Validate file size
    - Sanitize filename
    - Generate unique filenames (UUID)
11. **Test upload flow:**
    - Upload single image
    - Upload multiple images
    - Update product images
    - Delete product (cleanup images)

**Kết quả mong đợi:** Robust image upload system integrated with Products

**💡 Recommendations:**

- Development: Use local storage
- Production: Use S3 or Cloudinary
- CDN: CloudFront (AWS) or Cloudinary's CDN
- Always generate thumbnails for list views

---

## 📝 Implementation Notes

**Pre-requisites:**
- [ ] Review task requirements carefully
- [ ] Check dependencies on other tasks
- [ ] Setup development environment

**Implementation Checklist:**
- [ ] Complete all steps listed above
- [ ] Write unit tests
- [ ] Write integration tests (if applicable)
- [ ] Update API documentation (Swagger)
- [ ] Code review
- [ ] Test manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
- [ ] Commit and push changes

**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
