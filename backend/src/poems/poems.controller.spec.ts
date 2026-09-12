import { Test, TestingModule } from '@nestjs/testing';
import { PoemsController } from './poems.controller';

describe('PoemsController', () => {
  let controller: PoemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoemsController],
    }).compile();

    controller = module.get<PoemsController>(PoemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
