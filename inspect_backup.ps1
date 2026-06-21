$backupFile = "d:\Projects\tugasdiyan\db_cluster-16-11-2025@15-47-52.backup.gz"
$storageFile = "d:\Projects\tugasdiyan\qfgzvvmxbpvryrrneqnh.storage (1).zip"

Write-Host "=== Backup File ==="
$f = Get-Item $backupFile
Write-Host "Size: $($f.Length) bytes"

# Read magic bytes
$stream = [System.IO.File]::OpenRead($backupFile)
$bytes = New-Object byte[] 10
$stream.Read($bytes, 0, 10) | Out-Null
$stream.Close()
$hex = ($bytes | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
Write-Host "Magic bytes: $hex"

# Check if gzip (1F 8B)
if ($bytes[0] -eq 0x1F -and $bytes[1] -eq 0x8B) {
    Write-Host "Format: GZIP compressed"
    
    # Decompress and check inner format
    $outFile = "d:\Projects\tugasdiyan\db_backup_decompressed.backup"
    $inStream = New-Object System.IO.FileStream($backupFile, [System.IO.FileMode]::Open)
    $gzStream = New-Object System.IO.Compression.GZipStream($inStream, [System.IO.Compression.CompressionMode]::Decompress)
    $outStream = New-Object System.IO.FileStream($outFile, [System.IO.FileMode]::Create)
    $gzStream.CopyTo($outStream)
    $outStream.Close()
    $gzStream.Close()
    $inStream.Close()
    
    $decompressed = Get-Item $outFile
    Write-Host "Decompressed size: $($decompressed.Length) bytes"
    
    # Read first bytes of decompressed
    $stream2 = [System.IO.File]::OpenRead($outFile)
    $bytes2 = New-Object byte[] 20
    $stream2.Read($bytes2, 0, 20) | Out-Null
    $stream2.Close()
    $hex2 = ($bytes2 | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
    Write-Host "Inner magic bytes: $hex2"
    
    # Check if pg_dump custom format (PGDMP)
    $text = [System.Text.Encoding]::ASCII.GetString($bytes2, 0, 5)
    Write-Host "Inner text start: $text"
    
    if ($text -eq "PGDMP") {
        Write-Host "Inner format: PostgreSQL custom dump (pg_dump -Fc)"
    } else {
        # Try reading as text
        $lines = Get-Content $outFile -TotalCount 30 -ErrorAction SilentlyContinue
        Write-Host "=== First 30 lines ==="
        $lines | ForEach-Object { Write-Host $_ }
    }
} else {
    Write-Host "Not gzip, checking if PostgreSQL custom dump..."
    $text = [System.Text.Encoding]::ASCII.GetString($bytes, 0, 5)
    Write-Host "Text start: $text"
}

Write-Host ""
Write-Host "=== Storage File ==="
$sf = Get-Item $storageFile
Write-Host "Size: $($sf.Length) bytes"
