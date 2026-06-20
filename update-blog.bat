@echo off
chcp 65001 > nul
setlocal

echo 博客更新脚本启动中...
echo.

cd /d %~dp0
echo 当前目录: %CD%
echo.

git rev-parse --is-inside-work-tree > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo 当前目录不是 Git 仓库。
    goto error
)

echo 正在生成博客数据...
call pnpm run generate-data
IF %ERRORLEVEL% NEQ 0 (
    echo 数据生成失败！
    goto error
)
echo 数据生成完成！
echo.

echo 添加所有文件...
git add -A
IF %ERRORLEVEL% NEQ 0 (
    echo 添加文件失败！
    goto error
)

git diff --cached --quiet
IF %ERRORLEVEL% EQU 0 (
    echo 没有需要提交的更改。
    goto success
)
IF %ERRORLEVEL% GTR 1 (
    echo 检查暂存区失败！
    goto error
)

git diff --cached --check
IF %ERRORLEVEL% NEQ 0 (
    echo 检测到空白或冲突标记问题，请先修复。
    goto error
)

echo 提交更改...
git commit -m "文章更新"
IF %ERRORLEVEL% NEQ 0 (
    echo 提交失败！
    goto error
)

echo 推送到远程仓库...
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
git rev-parse --abbrev-ref --symbolic-full-name @{u} > nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    git push
) ELSE (
    git push -u origin "%CURRENT_BRANCH%"
)
IF %ERRORLEVEL% NEQ 0 (
    echo 推送失败！
    goto error
)

:success
echo.
echo 博客更新成功完成！
goto end

:error
echo.
echo 发生错误，操作未完成！
pause

:end
echo.
echo 按任意键退出...
pause > nul
endlocal
