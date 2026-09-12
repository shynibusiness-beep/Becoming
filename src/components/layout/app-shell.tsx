import type { ReactNode } from 'react';

import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';
import { TopBar } from './top-bar';

/**
 * Responsive application shell.
 *
 * Mobile first (primary design viewport ~390px): top bar, scrolling content,
 * bottom navigation. From `md` up the bottom navigation is replaced by a
 * sidebar and the content column keeps its comfortable reading measure.
 */
export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-(--layout-wide-max) flex-1 px-(--layout-gutter) py-6 focus-visible:outline-none"
        >
          <div className="mx-auto w-full max-w-(--layout-content-max) md:mx-0">
            {children}
          </div>
        </main>

        {/* Keeps the last element clear of the fixed bottom navigation. */}
        <div aria-hidden="true" className="h-(--layout-bottom-nav-height) md:hidden" />
      </div>

      <BottomNav />
    </div>
  );
}
