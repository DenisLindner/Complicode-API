import {
  GENERATED_CHALLENGE,
  MODEL_ANSWER,
} from '../../test/fixtures/generated-challenge';
import { parseGeneratedChallenge } from './challenge.parser';

describe('parseGeneratedChallenge', () => {
  const answer = (changes: object) =>
    JSON.stringify({ ...JSON.parse(MODEL_ANSWER), ...changes });

  it('splits the model answer into the summary fields and the document', () => {
    expect(parseGeneratedChallenge(MODEL_ANSWER)).toEqual(GENERATED_CHALLENGE);
  });

  it('trims texts, drops empty items and unwraps the folder tree', () => {
    const challenge = parseGeneratedChallenge(
      answer({
        title: '  Sistema  ',
        deliverables: ['README', ' ', 'Testes '],
        folderStructure: '```text\nsrc/\n└── app/\n```',
      }),
    );

    expect(challenge.title).toBe('Sistema');
    expect(challenge.content.deliverables).toEqual(['README', 'Testes']);
    expect(challenge.content.folderStructure).toBe('src/\n└── app/');
  });

  it.each([
    ['a missing text', { projectName: undefined }, 'projectName'],
    ['an empty list', { functionalRequirements: [] }, 'functionalRequirements'],
    [
      'an invalid nested item',
      { technologies: [{ category: 'Backend', items: [{ name: 'NestJS' }] }] },
      'purpose',
    ],
    ['a list with no texts', { context: ['', '  '] }, 'context'],
  ])('rejects %s', (_case, changes, field) => {
    expect(() => parseGeneratedChallenge(answer(changes))).toThrow(
      `invalid "${field}" field`,
    );
  });

  it('rejects answers that are not JSON objects', () => {
    expect(() => parseGeneratedChallenge('[]')).toThrow('invalid "root"');
    expect(() => parseGeneratedChallenge(undefined)).toThrow(SyntaxError);
  });
});
