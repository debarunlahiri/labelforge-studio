import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faCircleQuestion,
  faKeyboard,
  faPenRuler,
  faPrint,
} from '@fortawesome/free-solid-svg-icons'
import { useSearchParams } from 'react-router-dom'
import PageHero from '../components/PageHero'

type HelpSection = 'getting-started' | 'designer' | 'printing' | 'shortcuts'

const sectionNames: Record<HelpSection, string> = {
  'getting-started': 'Getting Started',
  designer: 'Template Designer',
  printing: 'Printing & Printers',
  shortcuts: 'Keyboard Shortcuts',
}

function GuideCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function Help() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get('section') as HelpSection | null
  const activeSection: HelpSection = requestedSection && requestedSection in sectionNames ? requestedSection : 'getting-started'
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const modifier = isMac ? '⌘' : 'Ctrl'
  const alt = isMac ? '⌥' : 'Alt'

  const shortcuts = [
    ['Save', `${modifier}+S`],
    ['Save as', `${modifier}+Shift+S`],
    ['Print', `${modifier}+P`],
    ['Undo', `${modifier}+Z`],
    ['Redo', isMac ? '⌘+Shift+Z' : 'Ctrl+Y'],
    ['Copy', `${modifier}+C`],
    ['Cut', `${modifier}+X`],
    ['Paste', `${modifier}+V`],
    ['Duplicate', `${modifier}+D`],
    ['Select all items', `${modifier}+A`],
    ['Delete selected items', isMac ? 'Delete / Backspace' : 'Delete / Backspace'],
    ['Zoom in', `${modifier}++`],
    ['Zoom out', `${modifier}+-`],
    ['Save inline text', `${modifier}+Enter`],
    ['Temporarily disable snapping while dragging', `${alt}+Drag`],
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <PageHero
        eyebrow="Guides and reference"
        title="Help"
        description="Learn the main Label Maker workflows and keyboard shortcuts."
        icon={faCircleQuestion}
        accent="violet"
      />

      <nav className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {([
          ['getting-started', faBookOpen],
          ['designer', faPenRuler],
          ['printing', faPrint],
          ['shortcuts', faKeyboard],
        ] as const).map(([section, icon]) => (
          <button
            key={section}
            type="button"
            onClick={() => setSearchParams({ section })}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ${
              activeSection === section ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FontAwesomeIcon icon={icon} fixedWidth />
            {sectionNames[section]}
          </button>
        ))}
      </nav>

      {activeSection === 'getting-started' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GuideCard title="Create your first label" steps={[
            'Open Design and choose New Design.',
            'Select a preset artboard size or enter custom dimensions.',
            'Choose a detected printer if the design is intended for a specific device.',
            'Add text, barcodes, QR codes, images, shapes, counters, or date fields.',
            'Save the design, then use Print or the keyboard shortcut to prepare the job.',
          ]} />
          <GuideCard title="Main application areas" steps={[
            'Dashboard shows recent designs, production totals, and common actions.',
            'Design Library contains saved templates, versions, imports, and exports.',
            'Printers detects devices installed through the operating system.',
            'Settings controls defaults, autosave, printing, appearance, and startup behavior.',
          ]} />
        </div>
      )}

      {activeSection === 'designer' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GuideCard title="Working in Template Designer" steps={[
            'Use the top toolbar to add objects, save, export, print, undo, and redo.',
            'Select an item to edit its properties in the right-side panel.',
            'Use Layers to reorder, rename, group, hide, or lock design items.',
            'Right-click an item for copy, image fitting, layer order, and delete actions.',
            'Hold Alt or Option while dragging to temporarily disable snapping.',
          ]} />
          <GuideCard title="Artboard and data" steps={[
            'Artboard settings control label width, height, measurement unit, and DPI.',
            'Grid and snapping preferences can be configured globally in Settings.',
            'Data sources connect template objects to reusable or print-time values.',
            'Saved versions preserve the design canvas and production configuration.',
          ]} />
        </div>
      )}

      {activeSection === 'printing' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GuideCard title="Set up a printer" steps={[
            'Install or connect the printer through Windows, macOS, or Linux first.',
            'Open Settings or Printers and run detection.',
            'Choose a detected device as the default printer if desired.',
            'Label Maker uses the operating-system printer and driver names directly.',
          ]} />
          <GuideCard title="Print a design" steps={[
            `Open a saved design and press ${modifier}+P, or choose Print in the toolbar.`,
            'Confirm that paper size matches the artboard size and select orientation.',
            'Choose the detected destination printer and number of copies.',
            'Review labels-per-page, placement, margins, gaps, and printer language.',
            'Send the job and review Print History when history retention is enabled.',
          ]} />
        </div>
      )}

      {activeSection === 'shortcuts' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">{isMac ? 'macOS' : 'Windows and Linux'} shortcuts</h2>
            <p className="mt-1 text-sm text-slate-500">The correct modifier keys are shown automatically for this computer.</p>
          </div>
          <div className="grid sm:grid-cols-2">
            {shortcuts.map(([action, keys]) => (
              <div key={action} className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-3.5 odd:sm:border-r">
                <span className="text-sm text-slate-700">{action}</span>
                <kbd className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">{keys}</kbd>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
