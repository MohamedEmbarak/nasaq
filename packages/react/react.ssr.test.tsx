// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import * as Nasaq from './src/index.js';

describe('React server rendering', () => {
  it('imports and renders the complete catalog without browser globals', () => {
    expect(typeof window).toBe('undefined');
    const html = renderToString(<>
      <Nasaq.Button>Continue</Nasaq.Button>
      <Nasaq.Field label="Reference"><Nasaq.TextField name="reference" /></Nasaq.Field>
      <Nasaq.Textarea label="Notes" /><Nasaq.Select label="Service" options={[{ value: 'permit', label: 'Permit' }]} />
      <Nasaq.Checkbox label="Agree" /><Nasaq.Radio name="kind" label="Person" /><Nasaq.Switch label="Alerts" />
      <Nasaq.Tabs label="Details" items={[{ value: 'one', label: 'One', content: 'First' }]} />
      <Nasaq.Dialog title="Confirm" defaultOpen>Ready</Nasaq.Dialog>
      <Nasaq.Combobox label="City" options={[{ value: 'riyadh', label: 'Riyadh' }]} />
      <Nasaq.Accordion items={[{ value: 'faq', title: 'Question', content: 'Answer' }]} />
      <Nasaq.Card header="Card">Body</Nasaq.Card><Nasaq.Badge>New</Nasaq.Badge><Nasaq.Alert>Update</Nasaq.Alert>
      <Nasaq.Table caption="Requests"><tbody><tr><td>One</td></tr></tbody></Nasaq.Table>
      <Nasaq.Pagination totalPages={2} /><Nasaq.Breadcrumb items={[{ label: 'Home' }]} />
      <Nasaq.Progress label="Complete" value={50} /><Nasaq.Skeleton /><Nasaq.Spinner />
      <Nasaq.Avatar name="Demo User" /><Nasaq.Divider />
      <Nasaq.Tooltip content="Help"><Nasaq.Button>Info</Nasaq.Button></Nasaq.Tooltip>
      <Nasaq.FileUpload label="Attachment" /><Nasaq.Stepper current="start" items={[{ value: 'start', label: 'Start' }]} />
      <Nasaq.EmptyState title="No requests" />
    </>);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('type="file"');
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/u);
  });
});
