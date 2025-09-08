Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Получаем границы всех экранов
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen

# Создаем bitmap для всего виртуального экрана
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height

# Создаем graphics объект
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Копируем изображение с экрана
$graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)

# Сохраняем
$bitmap.Save('C:\screenshots\test_all_screens.png')

# Освобождаем ресурсы
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Screenshot saved to C:\screenshots\test_all_screens.png"
Write-Host "Size: $($bounds.Width)x$($bounds.Height)"
