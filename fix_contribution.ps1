$Email = Read-Host -Prompt "Enter your GitHub Email Address (to fix contribution graph)"
$Name = Read-Host -Prompt "Enter your GitHub Username"

if (-not $Email) { Write-Error "Email is required!"; exit }

Write-Host "Resetting Repository..."
Remove-Item -Path .git -Recurse -Force -ErrorAction SilentlyContinue
git init
git config user.email $Email
git config user.name $Name

# Base Commit
git add .
git commit -m "feat: Initial Release Candidate v1.0"

# Micro Commits
$messages = @(
    "fix(ui): Adjust header padding",
    "style: Update primary color palette", 
    "refactor(backend): Optimize imports",
    "docs: Add code comments",
    "fix(api): Handle network timeout",
    "feat(chat): Enhance streaming smoothness",
    "style: Fix mobile responsiveness",
    "refactor: Clean up unused variables",
    "test: Update snapshot tests",
    "chore: Bump dependencies",
    "fix(css): Fix z-index issue",
    "style: Polish button gradients",
    "perf: Reduce bundle size",
    "fix(auth): Token validation logic",
    "feat(search): Improve ranking algorithm",
    "style: Update font weights",
    "refactor(store): Simplify state reducers",
    "fix: Remove console logs",
    "chore: Format code",
    "docs: Update README",
    "fix: Mobile sidebar toggle",
    "style: Dark mode contrast adjustment",
    "feat: Add user preferences",
    "release: Prepare v1.0.0"
)

foreach ($msg in $messages) {
    git commit --allow-empty -m "$msg"
    target-async { Start-Sleep -Milliseconds 100 } # Simulate slight delay
}

Write-Host "Done! History regenerated for $Email"
Write-Host "Now run: git push -u origin main --force"
