import { Filter, Field, GpuFilter } from "reducers/vis-state-updaters";

export function setFilterGpuMode(filter: Filter, filters: Filter[]): Filter;
export function assignGpuChannel(filter: Filter, filters: Filter[]): Filter;
export function assignGpuChannels(allFilters: Filter[]): Filter[];
export function resetFilterGpuMode(filters: Filter[]): Filter[];
export function getGpuFilterProps(filters: Filter[], dataId: string, fields: Field[]): GpuFilter;
export function getDatasetFieldIndexForFilter(dataId: string, filter: Filter): number;
