import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import MinskApp from './MinskApp';

vi.mock('./workbench/icons',()=>({Icon:()=>null}));

describe('Minsk startup rendering',()=>{
  it('renders the prepared workflow on the first render',()=>{
    const html=renderToStaticMarkup(<MinskApp/>);
    expect(html).toContain('Investigation Workbench');
    expect(html).toContain('The Missing Approval');
    expect(html).not.toContain('Loading workflow records');
    expect(html).not.toContain('Retry loading');
  });
});
