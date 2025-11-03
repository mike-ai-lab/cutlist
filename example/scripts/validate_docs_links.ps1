<#
Validate docs image references and local fallbacks.

Usage (PowerShell):
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; `
  & .\validate_docs_links.ps1

What it does:
- Scans all Markdown files in example/docs/ for image references.
- Finds patterns that use the placeholder {{IMAGE_BASE}} and checks for a local fallback image (e.g. ../diagram_example.JPG) present in example/.
- Checks plain relative image links (e.g. diagram_example.JPG) exist in the example/ folder.
- Exits with code 0 if all referenced local fallback images exist, or 1 if any are missing.
#>

Param()

Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$docsDir = Resolve-Path -Path (Join-Path $scriptDir '..\docs')
$exampleDir = Resolve-Path -Path (Join-Path $scriptDir '..')

Write-Host "Docs directory: $docsDir"
Write-Host "Example media directory (local fallback): $exampleDir"

$mdFiles = Get-ChildItem -Path $docsDir -Filter *.md -Recurse

$missing = @()

foreach ($file in $mdFiles) {
    $text = Get-Content -Raw -Path $file.FullName -ErrorAction Stop

    # 1) Markdown image links: ![alt](path)
    $mdImgRegex = [regex] '!\[[^\]]*\]\(([^)]+)\)'
    $mdMatches = $mdImgRegex.Matches($text)
    foreach ($m in $mdMatches) {
        $path = $m.Groups[1].Value.Trim()
            if ($path -like '*{{IMAGE_BASE}}/*') {
                # find the source line that contains this reference and try to extract a ../fallback filename
                $line = ($text -split "`n") | Where-Object { $_ -match [regex]::Escape($path) } | Select-Object -First 1
                if ($line) {
                    $idx = $line.IndexOf("../")
                    if ($idx -ge 0) {
                        $sub = $line.Substring($idx + 3)
                        $endChars = @("'", '"', ')', ' ', "`t")
                        $endIdx = -1
                        foreach ($c in $endChars) {
                            $i = $sub.IndexOf($c)
                            if ($i -ge 0) {
                                if ($endIdx -eq -1 -or $i -lt $endIdx) { $endIdx = $i }
                            }
                        }
                        if ($endIdx -ge 0) { $filename = $sub.Substring(0, $endIdx) } else { $filename = $sub }
                        $filename = $filename -replace '^[\.\/]+',''
                        $localPath = Join-Path $exampleDir $filename
                        if (-not (Test-Path $localPath)) {
                            $missing += [PSCustomObject]@{file=$file.Name; reference=$path; expectedLocal=$localPath}
                        }
                    } else {
                        Write-Warning "No local fallback found on line for placeholder image in $($file.Name): $path"
                    }
                }
            } else {
            # relative or absolute path — check local file presence (relative to example/)
            $rel = $path -replace '^[\.\/]+','' # strip leading ./ or ../
            $localPath = Join-Path $exampleDir $rel
            if ($path -notmatch '^(https?:)?\/\/' -and -not (Test-Path $localPath)) {
                $missing += [PSCustomObject]@{file=$file.Name; reference=$path; expectedLocal=$localPath}
            }
        }
    }

    # 2) HTML <img ...> tags: parse lines containing <img and extract src= attribute manually
    $lines = $text -split "`n"
    foreach ($line in $lines) {
        if ($line -notmatch '<img') { continue }
        $idxSrc = $line.IndexOf('src=')
        if ($idxSrc -lt 0) { continue }
        $after = $line.Substring($idxSrc + 4).TrimStart()
        # Determine delimiter if present
        $firstChar = $after.Substring(0,1)
        if ($firstChar -eq '"' -or $firstChar -eq "'") {
            $delim = $firstChar
            $after = $after.Substring(1)
            $endIdx = $after.IndexOf($delim)
            if ($endIdx -lt 0) { $src = $after } else { $src = $after.Substring(0,$endIdx) }
        } else {
            # unquoted value: take until space or >
            $endChars = @(' ', '>')
            $endIdx = -1
            foreach ($c in $endChars) {
                $i = $after.IndexOf($c)
                if ($i -ge 0) {
                    if ($endIdx -eq -1 -or $i -lt $endIdx) { $endIdx = $i }
                }
            }
            if ($endIdx -ge 0) { $src = $after.Substring(0,$endIdx) } else { $src = $after }
        }

        $src = $src.Trim()
        if ($src -like '*{{IMAGE_BASE}}/*') {
            # try find a ../fallback in this line
            $idx = $line.IndexOf("../")
            if ($idx -ge 0) {
                $sub = $line.Substring($idx + 3)
                $endChars = @("'", '"', ')', ' ', "`t")
                $endIdx = -1
                foreach ($c in $endChars) {
                    $i = $sub.IndexOf($c)
                    if ($i -ge 0) {
                        if ($endIdx -eq -1 -or $i -lt $endIdx) { $endIdx = $i }
                    }
                }
                if ($endIdx -ge 0) { $filename = $sub.Substring(0, $endIdx) } else { $filename = $sub }
                $filename = $filename -replace '^[\.\/]+',''
                $localPath = Join-Path $exampleDir $filename
                if (-not (Test-Path $localPath)) {
                    $missing += [PSCustomObject]@{file=$file.Name; reference=$src; expectedLocal=$localPath}
                }
            } else {
                Write-Warning "No local fallback found in tag for placeholder image in $($file.Name): $src"
            }
        } else {
            # normal src (could be relative or remote)
            if ($src -notmatch '^(https?:)?\/\/') {
                $rel = $src -replace '^[\.\/]+',''
                $localPath = Join-Path $exampleDir $rel
                if (-not (Test-Path $localPath)) {
                    $missing += [PSCustomObject]@{file=$file.Name; reference=$src; expectedLocal=$localPath}
                }
            }
        }
    }
}

if ($missing.Count -gt 0) {
    Write-Host "\nValidation completed: MISSING FILES FOUND:`n" -ForegroundColor Red
    foreach ($item in $missing) {
        Write-Host "File: $($item.file)" -ForegroundColor Yellow
        Write-Host "  Reference: $($item.reference)" -ForegroundColor Gray
        Write-Host "  Expected local fallback: $($item.expectedLocal)" -ForegroundColor Cyan
        Write-Host ""
    }
    Write-Host "Please upload the missing images to the media repo and/or add local copies in the 'example/' folder." -ForegroundColor Magenta
    exit 1
} else {
    Write-Host "Validation completed: all referenced local fallback images exist." -ForegroundColor Green
    exit 0
}
