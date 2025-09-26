import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { BrowserService } from './browser.service';
import { QueueEngineService } from '../queue-engine/queue-engine.service';
import { CreateBrowserDto, UpdateBrowserDto } from './dto/browser.dto';
import { BrowserEntity } from './browser.entity';

@Controller('browsers')
export class BrowserController {
  constructor(
    private readonly browserService: BrowserService,
    private readonly queueEngineService: QueueEngineService,
  ) {}

  @Get()
  async findAll(): Promise<BrowserEntity[]> {
    return this.browserService.findAll();
  }

  @Get('active')
  async findActive(): Promise<BrowserEntity[]> {
    return this.browserService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BrowserEntity> {
    return this.browserService.findOne(id);
  }

  @Post()
  async create(@Body() createBrowserDto: CreateBrowserDto): Promise<BrowserEntity> {
    const browser = await this.browserService.create(createBrowserDto);
    
    // Restart queue engine to reinitialize browsers
    await this.queueEngineService.restart();
    
    return browser;
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrowserDto: UpdateBrowserDto
  ): Promise<BrowserEntity> {
    const browser = await this.browserService.update(id, updateBrowserDto);
    
    // Restart queue engine to apply changes
    await this.queueEngineService.restart();
    
    return browser;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.browserService.remove(id);
    
    // Restart queue engine to remove browser instance
    await this.queueEngineService.restart();
  }

  @Put(':id/toggle-active')
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<BrowserEntity> {
    const browser = await this.browserService.toggleActive(id);
    
    // Restart queue engine to apply active/inactive status
    await this.queueEngineService.restart();
    
    return browser;
  }

  @Post('restart-engines')
  @HttpCode(HttpStatus.OK)
  async restartEngines(): Promise<{ message: string }> {
    await this.queueEngineService.restart();
    return { message: 'Browser engines restarted successfully' };
  }

  @Get('available')
  async getAvailableBrowsers(): Promise<string[]> {
    // Get browser names from active browsers
    const activeBrowsers = await this.browserService.findActive();
    const browserNames = activeBrowsers.map(browser => browser.name);
    
    // Always include 'default' as the first option
    const availableBrowsers = ['default', ...browserNames.filter(name => name !== 'default')];
    
    return availableBrowsers;
  }
}
