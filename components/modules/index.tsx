'use client';
import type { Role } from '@/lib/types';
import { getEntity, hrefFor, moduleDef } from '@/lib/registry';
import { useStoreVersion } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import GisExplorer from '@/components/gis/GisExplorer';
import { DatasetsList, DatasetDetail, ResearchDetail, LibraryList, LiteratureDetail, PolicyDetail, ProgrammeDetail, CasesList, CaseDetail, NotFoundRecord } from '@/components/views/records';
import { ProblemsList, ProblemDetail } from '@/components/views/problem';
import { SimulatorHome, SimulatorDetail } from '@/components/views/simulator';
import { PilotsList, PilotDetail } from '@/components/views/pilot';
import { OpportunitiesList, OpportunityDetail } from '@/components/views/opportunity';
import { ConsultationsList, ConsultationDetail } from '@/components/views/consultation';
import { GovOverview, EvidenceExplorer, ProgrammeMonitor, ReportsModule, ReportDetail } from './gov';
import { ResearchHome, ProjectsModule, GapFinder, GapDetail, CollabList, CollabDetail, PublishModule, PublicationDetail } from './research';
import { PublicHome, PublicResearch, PublicPolicy, ArticleDetail, InsightsHome, InsightDetail, SchemesList } from './public';
import { SearchPage, AboutData } from './common';
import { PageHead } from '@/components/ui';

/** /portal/[role]/[module] */
export function ModulePage({ role, module }: { role: Role; module: string }) {
  const def = moduleDef(role, module);
  if (module === 'search') return <SearchPage role={role} />;
  if (module === 'about') return <AboutData role={role} />;
  const head = (extra?: React.ReactNode) => def ? <PageHead eyebrow={def.section} title={def.label} desc={def.desc} /> : null;
  void head;
  if (role === 'government') switch (module) {
    case 'overview': return <GovOverview />;
    case 'problems': return <ProblemsList />;
    case 'evidence': return <EvidenceExplorer />;
    case 'simulator': return <SimulatorHome />;
    case 'pilots': return <PilotsList />;
    case 'gis': return <><PageHead eyebrow="Intelligence" title="GIS Intelligence" desc="Find where a problem is concentrated, compare it with the average, and turn a finding into a policy problem. All values are demo data on a schematic map." /><GisExplorer role={role} /></>;
    case 'programmes': return <ProgrammeMonitor />;
    case 'datasets': return <DatasetsList role={role} />;
    case 'cases': return <><PageHead eyebrow="Knowledge" title="Case Studies" desc="Structured accounts of interventions: the problem, what was done, the outcome, the evidence and the lessons." /><CasesList role={role} /></>;
    case 'innovation': return <OpportunitiesList role={role} />;
    case 'reports': return <ReportsModule />;
  }
  if (role === 'researcher') switch (module) {
    case 'overview': return <ResearchHome />;
    case 'projects': return <ProjectsModule />;
    case 'datasets': return <DatasetsList role={role} />;
    case 'library': return <LibraryList role={role} />;
    case 'gis': return <><PageHead eyebrow="Analysis" title="GIS Workspace" desc="Pick an area and layer, then correlate it with a second layer below the map and save the analysis to your active project. Values are demo data." /><GisExplorer role={role} /></>;
    case 'gaps': return <GapFinder />;
    case 'collab': return <CollabList />;
    case 'grants': return <OpportunitiesList role={role} />;
    case 'publish': return <PublishModule />;
  }
  switch (module) {
    case 'overview': return <PublicHome />;
    case 'atlas': return <><PageHead eyebrow="Explore" title="Land Atlas" desc="Pick a place and a topic. The map colours show how places compare; click one to read what it means. Everything here is demo data on a schematic map." /><GisExplorer role={role} /></>;
    case 'research': return <PublicResearch />;
    case 'policy': return <PublicPolicy />;
    case 'insights': return <InsightsHome />;
    case 'data': return <DatasetsList role={role} />;
    case 'consultations': return <ConsultationsList role={role} />;
    case 'schemes': return <SchemesList />;
  }
  return <NotFoundRecord role={role} module="overview" />;
}

/** /portal/[role]/[module]/[id] – the module decides which views may be shown; records opened from the wrong module are redirected */
export function DetailPage({ role, module, id }: { role: Role; module: string; id: string }) {
  useStoreVersion(); const router = useRouter(); const e = getEntity(id);
  const correct = e ? hrefFor(role, id) : undefined;
  useEffect(() => { if (correct && !correct.includes(`/${module}/`)) router.replace(correct); }, [correct, module, router]);
  if (module === 'insights' && role === 'public') return <InsightDetail id={id} />;
  if (!e) return <NotFoundRecord role={role} module={module} />;
  if (!correct) return <NotFoundRecord role={role} module={module} />;
  if (!correct.includes(`/${module}/`)) return <div className="empty">Opening…</div>;
  switch (e.kind) {
    case 'dataset': return <DatasetDetail role={role} id={id} />;
    case 'research': return <ResearchDetail role={role} id={id} />;
    case 'literature': return <LiteratureDetail role={role} id={id} />;
    case 'policy': return <PolicyDetail role={role} id={id} />;
    case 'programme': return <ProgrammeDetail role={role} id={id} />;
    case 'case': return <CaseDetail role={role} id={id} />;
    case 'problem': return <ProblemDetail id={id} />;
    case 'simulation': return <SimulatorDetail id={id} />;
    case 'pilot': return <PilotDetail id={id} />;
    case 'opportunity': return <OpportunityDetail role={role} id={id} />;
    case 'consultation': return <ConsultationDetail role={role} id={id} />;
    case 'report': return <ReportDetail id={id} />;
    case 'article': return <ArticleDetail id={id} />;
    case 'gap': return <GapDetail id={id} />;
    case 'team': return <CollabDetail id={id} />;
    case 'publication': return <PublicationDetail id={id} />;
  }
}
