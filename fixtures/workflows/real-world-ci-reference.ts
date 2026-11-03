import {WorkflowSchema} from '../../packages/contracts/src';
import correctedWorkflow from '../../model-evaluation/real-world-reference/corrected-workflow.json';

export const realWorldCiReference=WorkflowSchema.parse(correctedWorkflow);
