Add-Type -AssemblyName System.IO.Compression.FileSystem

function ExtractText($path) {
    if (-not (Test-Path $path)) { Write-Output "Not found: $path"; return }
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    $xmlEntry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    if ($null -eq $xmlEntry) {
         Write-Output "No word/document.xml found in $path"
         return
    }
    $stream = $xmlEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $stream.Close()
    $zip.Dispose()
    $xml = $xml -replace '<[^>]+>', ' ' -replace '\s+', ' '
    Write-Output "--------------------------------------------------------"
    Write-Output "--- CONTENT OF $path ---"
    Write-Output $xml
    Write-Output "--------------------------------------------------------"
}

$files = Get-ChildItem "d:\huynhhoangthinh" -Filter "*.docx"
foreach ($f in $files) { 
    ExtractText($f.FullName) 
}
