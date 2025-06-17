@echo off
echo 博客更新脚本启动中...
echo.

REM 切换到项目目录
cd /d %~dp0
echo 当前目录: %CD%
echo.

REM 执行git命令
echo 添加所有文件...
git add .
IF %ERRORLEVEL% NEQ 0 (
    echo 添加文件失败！
    goto error
)

echo 提交更改...
git commit -m "文章更新"
IF %ERRORLEVEL% NEQ 0 (
    echo 提交失败！
    goto error
)

echo 推送到远程仓库...
git push
IF %ERRORLEVEL% NEQ 0 (
    echo 推送失败！
    goto error
)

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