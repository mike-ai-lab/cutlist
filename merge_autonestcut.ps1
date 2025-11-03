$root = "F:\alt_drive\cutlist\AutoNestCut"
$outFile = Join-Path $root "AUTONESTCUT_MERGED.txt"

# remove old file if exists
if (Test-Path $outFile) { Remove-Item $outFile -Force }

Add-Content $outFile "EXTENSION: AUTONESTCUT"
Add-Content $outFile ""
Add-Content $outFile "FOLDER STRUCTURE:"
Add-Content $outFile ""
# folder tree
$tree = tree $root /f
Add-Content $outFile $tree
Add-Content $outFile ""
Add-Content $outFile "CODEBASE MERGED FOR REFERENCE:"
Add-Content $outFile ""

# loop all files recursively
Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
    $filePath = $_.FullName
    Add-Content $outFile "-------------------------------------------"
    Add-Content $outFile "FILE: $filePath"
    Add-Content $outFile ""
    # read text safely; binary files will be printed as hex
    try {
        $content = Get-Content $filePath -Raw -ErrorAction Stop
        Add-Content $outFile $content
    } catch {
        $bytes = [BitConverter]::ToString([IO.File]::ReadAllBytes($filePath))
        Add-Content $outFile "[BINARY FILE, HEX ENCODED]"
        Add-Content $outFile $bytes
    }
    Add-Content $outFile ""
}

Write-Host "Merged file created at: $outFile"
