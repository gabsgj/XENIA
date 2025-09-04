# Test syllabus upload with topic filtering
$uri = "http://localhost:8000/api/upload/syllabus"
$filePath = "test_syllabus_content.txt"

# Create multipart form data
Add-Type -AssemblyName System.Net.Http

$httpClientHandler = New-Object System.Net.Http.HttpClientHandler
$httpClient = New-Object System.Net.Http.HttpClient $httpClientHandler
$multipartContent = New-Object System.Net.Http.MultipartFormDataContent

# Add file
$fileContent = [System.IO.File]::ReadAllBytes($filePath)
$byteArrayContent = New-Object System.Net.Http.ByteArrayContent @(,$fileContent)
$byteArrayContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("text/plain")
$multipartContent.Add($byteArrayContent, "file", $filePath)

# Add user_id
$stringContent = New-Object System.Net.Http.StringContent "test-user-123"
$multipartContent.Add($stringContent, "user_id")

try {
    $response = $httpClient.PostAsync($uri, $multipartContent).Result
    $content = $response.Content.ReadAsStringAsync().Result
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $content"
} catch {
    Write-Host "Error: $_"
} finally {
    $httpClient.Dispose()
}
