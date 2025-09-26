import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowserEntity } from './browser.entity';
import { CreateBrowserDto, UpdateBrowserDto } from './dto/browser.dto';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);

  constructor(
    @InjectRepository(BrowserEntity)
    private browserRepository: Repository<BrowserEntity>,
  ) {}

  async findAll(): Promise<BrowserEntity[]> {
    return this.browserRepository.find({
      order: { createdAt: 'ASC' }
    });
  }

  async findActive(): Promise<BrowserEntity[]> {
    return this.browserRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' }
    });
  }

  async findOne(id: number): Promise<BrowserEntity> {
    const browser = await this.browserRepository.findOne({ where: { id } });
    if (!browser) {
      throw new NotFoundException(`Browser with ID ${id} not found`);
    }
    return browser;
  }

  async findByName(name: string): Promise<BrowserEntity | null> {
    return this.browserRepository.findOne({ where: { name } });
  }

  async create(createBrowserDto: CreateBrowserDto): Promise<BrowserEntity> {
    // Check if browser with this name already exists
    const existingBrowser = await this.findByName(createBrowserDto.name);
    if (existingBrowser) {
      throw new ConflictException(`Browser with name "${createBrowserDto.name}" already exists`);
    }

    const browser = this.browserRepository.create(createBrowserDto);
    const savedBrowser = await this.browserRepository.save(browser);
    
    this.logger.log(`Created browser: ${savedBrowser.name} (ID: ${savedBrowser.id})`);
    return savedBrowser;
  }

  async update(id: number, updateBrowserDto: UpdateBrowserDto): Promise<BrowserEntity> {
    const browser = await this.findOne(id);

    // Check name uniqueness if name is being updated
    if (updateBrowserDto.name && updateBrowserDto.name !== browser.name) {
      const existingBrowser = await this.findByName(updateBrowserDto.name);
      if (existingBrowser) {
        throw new ConflictException(`Browser with name "${updateBrowserDto.name}" already exists`);
      }
    }

    Object.assign(browser, updateBrowserDto);
    const updatedBrowser = await this.browserRepository.save(browser);
    
    this.logger.log(`Updated browser: ${updatedBrowser.name} (ID: ${updatedBrowser.id})`);
    return updatedBrowser;
  }

  async remove(id: number): Promise<void> {
    const browser = await this.findOne(id);
    await this.browserRepository.remove(browser);
    
    this.logger.log(`Removed browser: ${browser.name} (ID: ${id})`);
  }

  async toggleActive(id: number): Promise<BrowserEntity> {
    const browser = await this.findOne(id);
    browser.isActive = !browser.isActive;
    const updatedBrowser = await this.browserRepository.save(browser);
    
    this.logger.log(`Toggled browser ${updatedBrowser.name} active status to: ${updatedBrowser.isActive}`);
    return updatedBrowser;
  }
}
