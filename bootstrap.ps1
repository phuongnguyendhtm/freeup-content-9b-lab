# Run from an extracted release. Arguments are passed as an array, never interpolated into a shell command.
$ErrorActionPreference = 'Stop'
$installerArguments = @($args)
$candidates = [System.Collections.Generic.List[string]]::new()
if ($env:NINEBIZ_NODE) { $candidates.Add($env:NINEBIZ_NODE) }
$pathNode = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pathNode) { $candidates.Add($pathNode.Source) }
foreach ($installRoot in @($env:NINEBIZ_INSTALL_ROOT, $env:NINEBIZ_CLI_ROOT)) {
  if ($installRoot) { $candidates.Add((Join-Path $installRoot 'vendor/node/node.exe')) }
}
if ($env:APPDATA) {
  foreach ($application in @('9BizClaw-v3', '9bizclaw-v2')) {
    $metadataRoot = Join-Path $env:APPDATA $application
    $metadataFile = Join-Path $metadataRoot 'install-root.json'
    $detectedRoot = $metadataRoot
    if (Test-Path -LiteralPath $metadataFile -PathType Leaf) {
      try { $metadata = Get-Content -LiteralPath $metadataFile -Raw | ConvertFrom-Json; if ($metadata.path -is [string]) { $detectedRoot = $metadata.path } } catch { continue }
    }
    $candidates.Add((Join-Path $detectedRoot 'vendor/node/node.exe'))
  }
}
$selectedNode = $null
foreach ($candidate in ($candidates | Select-Object -Unique)) {
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
  try {
    $version = & $candidate -p 'process.versions.node'
    if ($LASTEXITCODE -eq 0 -and $version -match '^([0-9]+)\.' -and [int]$Matches[1] -ge 22) { $selectedNode = $candidate; break }
  } catch { continue }
}
if (-not $selectedNode) { throw 'Node.js 22+ not found. Set NINEBIZ_NODE to the Node executable bundled with your 9B installation, then run this script again.' }
& $selectedNode (Join-Path $PSScriptRoot 'install.cjs') @installerArguments
exit $LASTEXITCODE
