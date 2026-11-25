# 把 store 版 APK 作为 GitHub Release 附件发布。
# 只用 store 包：内部自用版（文件名带 -owner）绕过购买直接解锁全部功能，绝不能公开。
# Release 附件不进 git 历史，二十多个版本也不会把仓库撑到几个 G。
# 本脚本必须纯 ASCII（PowerShell 5.1 会按 ANSI 读含中文的 .ps1）。

param(
    [Parameter(Mandatory = $true)][string]$Tag,
    [Parameter(Mandatory = $true)][string]$Apk,
    [Parameter(Mandatory = $true)][string]$NameFile,
    [Parameter(Mandatory = $true)][string]$BodyFile,
    [string]$Repo = 'lilinhai/palmwin-site'
)

$ErrorActionPreference = 'Stop'

function Get-GitHubToken {
    $req = Join-Path $env:TEMP 'pw_creq.txt'
    $out = Join-Path $env:TEMP 'pw_creq_out.txt'
    [System.IO.File]::WriteAllLines($req, @('protocol=https', 'host=github.com', ''))
    cmd /c "git credential fill < `"$req`" > `"$out`" 2>nul"
    $lines = [System.IO.File]::ReadAllLines($out)
    $tok = ($lines | Where-Object { $_ -match '^password=' }) -replace '^password=', ''
    Remove-Item $req, $out -Force -ErrorAction SilentlyContinue
    if (-not $tok) { throw 'no github token from credential manager' }
    return $tok
}

$tok = Get-GitHubToken
$hdr = @{
    'User-Agent'    = 'palmwin-releaser'
    'Accept'        = 'application/vnd.github+json'
    'Authorization' = "Bearer $tok"
}

if (-not (Test-Path $Apk)) { throw "apk not found: $Apk" }
$apkItem = Get-Item $Apk
if ($apkItem.Name -match 'owner') { throw 'refuse to publish the owner build' }

$name = [System.IO.File]::ReadAllText($NameFile, [System.Text.Encoding]::UTF8).Trim()
$body = [System.IO.File]::ReadAllText($BodyFile, [System.Text.Encoding]::UTF8)

Write-Host "tag    = $Tag"
Write-Host "asset  = $($apkItem.Name) ($($apkItem.Length) bytes)"
Write-Host "repo   = $Repo"

# 已存在的 release 直接复用，避免重复建
$existing = $null
try {
    $existing = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/tags/$Tag" `
        -Headers $hdr -TimeoutSec 30
} catch { }

if ($existing) {
    Write-Host "release exists: $($existing.html_url), upload id=$($existing.id)"
    $rel = $existing
} else {
    $payload = @{
        tag_name         = $Tag
        target_commitish = 'main'
        name             = $name
        body             = $body
        draft            = $false
        prerelease       = $false
    } | ConvertTo-Json -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases" -Method Post `
        -Headers $hdr -Body $bytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 60
    Write-Host "release created: $($rel.html_url), upload id=$($rel.id)"
}

# 同名附件已存在就跳过（重跑安全）
$assets = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/$($rel.id)/assets" `
    -Headers $hdr -TimeoutSec 30
$already = $assets | Where-Object { $_.name -eq $apkItem.Name }
if ($already) {
    Write-Host "asset already present: $($already.browser_download_url)"
    Write-Host "DONE $($rel.html_url)"
    exit 0
}

$uploadUrl = "https://uploads.github.com/repos/$Repo/releases/$($rel.id)/assets?name=$($apkItem.Name)"
$fileBytes = [System.IO.File]::ReadAllBytes($apkItem.FullName)
$assetHdr = @{
    'User-Agent'    = 'palmwin-releaser'
    'Accept'        = 'application/vnd.github+json'
    'Authorization' = "Bearer $tok"
    'Content-Type'  = 'application/vnd.android.package-archive'
}
Write-Host "uploading $([math]::Round($fileBytes.Length / 1MB, 1)) MB ..."
$asset = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $assetHdr `
    -Body $fileBytes -TimeoutSec 900
Write-Host "asset state = $($asset.state)  size = $($asset.size)"
Write-Host "download    = $($asset.browser_download_url)"
Write-Host "DONE $($rel.html_url)"
