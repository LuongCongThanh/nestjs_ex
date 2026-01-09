# ### ✅ TASK 56: File Upload Service

> **Task Number:** 56  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Upload và quản lý files (product images, avatars)

**Các bước thực hiện:**

1. Install dependencies:

   ```bash
   npm install @nestjs/platform-express multer
   npm install aws-sdk @aws-sdk/client-s3  # For AWS S3
   # OR
   npm install cloudinary  # For Cloudinary
   ```

2. Generate module: `nest g module modules/uploads`
3. Generate service: `nest g service modules/uploads`
4. Configure upload strategy (choose one):
   - **Local storage** (development):
     - Save to `public/uploads/`
     - Serve static files
   - **AWS S3** (production):
     - Configure S3 credentials
     - Create bucket
   - **Cloudinary** (alternative):
     - Configure Cloudinary account
5. Implement UploadService:
   - `uploadFile(file, folder)` - Upload single file
   - `uploadMultiple(files, folder)` - Upload multiple
   - `deleteFile(fileUrl)` - Delete file
   - `getSignedUrl(key)` - Temporary access URL
6. Create upload DTOs & validators:
   - File size limit (5MB for images)
   - Allowed mime types (image/jpeg, image/png, image/webp)
7. Endpoints:
   - POST /uploads/image (Single image)
   - POST /uploads/images (Multiple images)
   - DELETE /uploads/:key
8. Update Product & User entities:
   - Store file URLs/keys
9. Add image optimization:
   - Resize images
   - Generate thumbnails
   - WebP conversion
10. Test upload flow

**Kết quả mong đợi:** Robust file upload system with cloud storage

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
