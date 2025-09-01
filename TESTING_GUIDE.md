# PDF Upload/Stream/Download Testing Guide

## 🧪 Testing Overview

This guide covers comprehensive testing for the CourseModule PDF functionality including upload, streaming, download, and deletion operations.

## 1. Unit Testing

### Run Unit Tests
```bash
npm test course_module.service.spec.ts
```

### Coverage Areas
- ✅ PDF upload with valid files
- ✅ File validation (type, size)
- ✅ Error handling (module not found, invalid files)
- ✅ PDF listing and retrieval
- ✅ Streaming and download operations
- ✅ PDF deletion

## 2. Integration Testing (E2E)

### Run E2E Tests
```bash
npm run test:e2e course-module-pdf.e2e-spec.ts
```

### Coverage Areas
- ✅ Complete API workflow
- ✅ Authentication and authorization
- ✅ File system operations
- ✅ Database persistence
- ✅ HTTP response validation

## 3. Manual API Testing

### Prerequisites
1. Start the application: `npm run start:dev`
2. Get authentication token for program_admin user
3. Create a test course module
4. Prepare test PDF files

### 3.1 PDF Upload Testing

#### Valid Upload
```bash
curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf"
```

**Expected Response (201):**
```json
{
  "id": "pdf-uuid",
  "courseModuleId": "module-uuid",
  "fileName": "test.pdf",
  "filePath": "/uploads/courses/module-uuid/timestamp-random.pdf",
  "uploadedBy": "user-uuid",
  "uploadedAt": "2025-01-19T12:00:00.000Z",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

#### Invalid File Type
```bash
curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@test.txt"
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "Only PDF files are allowed"
}
```

#### File Too Large (>10MB)
```bash
# Create large file: dd if=/dev/zero of=large.pdf bs=1M count=11
curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@large.pdf"
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "File size must be less than 10MB"
}
```

#### Unauthorized Access
```bash
curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
  -F "file=@test.pdf"
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 3.2 PDF Listing Testing

```bash
curl -X GET "http://localhost:3000/modules/{moduleId}/pdfs" \
  -H "Authorization: Bearer {token}"
```

**Expected Response (200):**
```json
[
  {
    "id": "pdf-uuid",
    "fileName": "test.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2025-01-19T12:00:00.000Z",
    "uploadedBy": "user-uuid"
  }
]
```

### 3.3 PDF Download Testing

```bash
curl -X GET "http://localhost:3000/modules/{moduleId}/download/{pdfId}" \
  -H "Authorization: Bearer {token}" \
  -o downloaded.pdf \
  -v
```

**Expected Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="test.pdf"
Content-Length: 1024000
```

### 3.4 PDF Deletion Testing

```bash
curl -X DELETE "http://localhost:3000/modules/{moduleId}/pdf/{pdfId}" \
  -H "Authorization: Bearer {token}"
```

**Expected Response (200):**
```json
{
  "message": "PDF deleted successfully"
}
```

## 4. Server-Sent Events (SSE) Testing

### 4.1 Browser Testing (JavaScript)

Create an HTML file for testing SSE:

```html
<!DOCTYPE html>
<html>
<head>
    <title>PDF Streaming Test</title>
</head>
<body>
    <h1>PDF Streaming Test</h1>
    <button onclick="startStreaming()">Start PDF Stream</button>
    <div id="status"></div>
    <div id="progress"></div>
    <canvas id="pdfCanvas" style="border: 1px solid black;"></canvas>

    <script>
        let eventSource;
        let pdfChunks = [];
        
        function startStreaming() {
            const moduleId = 'your-module-id';
            const pdfId = 'your-pdf-id';
            const token = 'your-auth-token';
            
            const url = `http://localhost:3000/modules/${moduleId}/stream/${pdfId}`;
            
            eventSource = new EventSource(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            eventSource.onopen = function(event) {
                document.getElementById('status').innerHTML = 'Connected to stream';
            };
            
            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                if (data.type === 'chunk') {
                    pdfChunks[data.chunkIndex] = data.chunk;
                    
                    const progress = ((data.chunkIndex + 1) / data.totalChunks) * 100;
                    document.getElementById('progress').innerHTML = 
                        `Progress: ${progress.toFixed(1)}% (${data.chunkIndex + 1}/${data.totalChunks})`;
                    
                    if (data.isLast) {
                        // Reconstruct PDF
                        const base64Content = pdfChunks.join('');
                        const pdfBlob = base64ToBlob(base64Content, 'application/pdf');
                        
                        // Create download link
                        const url = URL.createObjectURL(pdfBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'streamed.pdf';
                        a.textContent = 'Download Streamed PDF';
                        document.body.appendChild(a);
                    }
                } else if (data.type === 'end') {
                    document.getElementById('status').innerHTML = 'Streaming completed';
                    eventSource.close();
                }
            };
            
            eventSource.onerror = function(event) {
                document.getElementById('status').innerHTML = 'Stream error occurred';
                console.error('SSE Error:', event);
            };
        }
        
        function base64ToBlob(base64, mimeType) {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: mimeType });
        }
    </script>
</body>
</html>
```

### 4.2 Command Line SSE Testing

```bash
curl -N -H "Authorization: Bearer {token}" \
  "http://localhost:3000/modules/{moduleId}/stream/{pdfId}"
```

**Expected Output:**
```
data: {"type":"chunk","chunk":"JVBERi0xLjQK...","chunkIndex":0,"totalChunks":100,"isLast":false}

data: {"type":"chunk","chunk":"VGhpcyBpcyBh...","chunkIndex":1,"totalChunks":100,"isLast":false}

...

data: {"type":"end","message":"PDF streaming completed"}
```

## 5. File System Testing

### 5.1 Directory Creation
Verify that upload directories are created:
```bash
ls -la uploads/courses/{moduleId}/
```

### 5.2 File Storage
Check that files are stored with unique names:
```bash
ls -la uploads/courses/{moduleId}/
# Should show: timestamp-randomstring.pdf
```

### 5.3 File Cleanup
After deletion, verify files are removed:
```bash
ls -la uploads/courses/{moduleId}/
# File should be gone after DELETE request
```

## 6. Database Testing

### 6.1 Verify PDF Records
```sql
SELECT * FROM course_module_pdfs WHERE courseModuleId = 'your-module-id';
```

### 6.2 Verify Relationships
```sql
SELECT cm.title, cmp.fileName, cmp.uploadedAt 
FROM course_modules cm 
JOIN course_module_pdfs cmp ON cm.id = cmp.courseModuleId;
```

### 6.3 Verify Cascade Deletion
```sql
-- Delete course module
DELETE FROM course_modules WHERE id = 'your-module-id';

-- Check that PDFs are also deleted
SELECT * FROM course_module_pdfs WHERE courseModuleId = 'your-module-id';
-- Should return no results
```

## 7. Performance Testing

### 7.1 Large File Upload
Test with files approaching the 10MB limit:
```bash
# Create 9MB test file
dd if=/dev/zero of=large-test.pdf bs=1M count=9

curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@large-test.pdf" \
  -w "Time: %{time_total}s\n"
```

### 7.2 Streaming Performance
Test streaming with large files and measure:
- Time to first chunk
- Total streaming time
- Memory usage during streaming

### 7.3 Concurrent Operations
Test multiple simultaneous uploads:
```bash
# Run multiple uploads in parallel
for i in {1..5}; do
  curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
    -H "Authorization: Bearer {token}" \
    -F "file=@test$i.pdf" &
done
wait
```

## 8. Error Handling Testing

### 8.1 Non-existent Module
```bash
curl -X POST "http://localhost:3000/modules/invalid-id/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@test.pdf"
# Expected: 404 Not Found
```

### 8.2 Corrupted Files
Upload corrupted PDF and test streaming/download behavior.

### 8.3 Disk Space Issues
Test behavior when disk is full (simulate with limited disk space).

## 9. Security Testing

### 9.1 Path Traversal
Try uploading files with malicious names:
```bash
curl -X POST "http://localhost:3000/modules/{moduleId}/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@../../../etc/passwd;filename=test.pdf"
```

### 9.2 Role-based Access
Test with different user roles (student, instructor, etc.).

### 9.3 JWT Token Validation
Test with expired, invalid, or missing tokens.

## 10. Logging Verification

Check application logs for all operations:
```bash
tail -f logs/application.log | grep -E "(UPLOAD_PDF|STREAM_PDF|DOWNLOAD_PDF|DELETE_PDF)"
```

**Expected Log Entries:**
- Upload start/success/error
- Stream start/success/error
- Download start/success/error
- Delete start/success/error
- Request IDs and user information

## 11. Frontend Integration Testing

### 11.1 React/Angular Component Testing
Test file upload components with:
- Drag and drop functionality
- Progress indicators
- Error handling
- File validation

### 11.2 PDF Viewer Integration
Test streaming integration with PDF.js or similar viewers.

## 12. Load Testing

Use tools like Apache Bench or Artillery:

```bash
# Upload load test
ab -n 100 -c 10 -T 'multipart/form-data' \
  -H "Authorization: Bearer {token}" \
  http://localhost:3000/modules/{moduleId}/upload

# Download load test  
ab -n 100 -c 10 \
  -H "Authorization: Bearer {token}" \
  http://localhost:3000/modules/{moduleId}/download/{pdfId}
```

## ✅ Testing Checklist

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual API testing complete
- [ ] SSE streaming works in browser
- [ ] File system operations verified
- [ ] Database operations verified
- [ ] Performance testing complete
- [ ] Error handling tested
- [ ] Security testing complete
- [ ] Logging verification complete
- [ ] Frontend integration tested
- [ ] Load testing complete

## 🐛 Common Issues & Solutions

1. **CORS Issues with SSE**: Configure CORS for EventSource
2. **File Permission Issues**: Check upload directory permissions
3. **Memory Issues**: Monitor memory usage during large file operations
4. **Token Expiration**: Handle JWT refresh in long-running streams
5. **Database Connection**: Ensure proper connection pooling for concurrent operations

This comprehensive testing approach ensures all aspects of the PDF functionality work correctly in various scenarios and edge cases.
