import { CreateChallengeDTO } from '../dto/create-challenge.dto';

export abstract class GenerativeService {
  abstract generateContent(data: CreateChallengeDTO): Promise<string>;
}
