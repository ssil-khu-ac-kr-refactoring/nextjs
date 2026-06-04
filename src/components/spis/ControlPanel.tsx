"use client";

import { Satellite, Sun, Moon, Clock, Globe2, Map as MapIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  FilterState,
  FormType,
  MaterialType,
  BodyMode,
  BoomMaterialType,
  ResistanceType,
  TimeModeUI,
  ViewMode,
  SimulationRow,
} from '@/lib/spis/types';
import {
  FORM_OPTIONS,
  MATERIAL_OPTIONS,
  BOOM_MATERIAL_OPTIONS,
  RESISTANCE_OPTIONS,
  INPUT_PARAM_OPTIONS,
  MATERIAL_PROP_OPTIONS,
  ENV_FIXED_VALUES,
  ENV_PARAM_VALUES,
  MATERIAL_PROP_VALUES,
} from '@/lib/spis/types';
import { getColorForValue } from '@/lib/spis/colorScale';

interface ControlPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onLoadDemoLocal: () => void;
  filteredData: SimulationRow[];
  dataRange: { min: number; max: number };
  dataCount: number;
  isLoading: boolean;
  now: Date;
}

function formatSciNum(v: number): string {
  if (v === 0) return '0';
  if (v === -1) return '-1';
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(2);
  return v.toString();
}

export function ControlPanel({
  filters,
  onFilterChange,
  onLoadDemoLocal,
  filteredData,
  dataRange,
  dataCount,
  isLoading,
  now,
}: ControlPanelProps) {
  const update = (partial: Partial<FilterState>) =>
    onFilterChange({ ...filters, ...partial });

  const legendSteps = 8;
  const legendColors = Array.from({ length: legendSteps + 1 }, (_, i) => {
    const value = dataRange.min + (i / legendSteps) * (dataRange.max - dataRange.min);
    return { value, color: getColorForValue(value, dataRange.min, dataRange.max) };
  });

  const isMulti = filters.bodyMode === 'multi';

  // Current average potential for selected combination
  const currentAvPot = filteredData.length > 0
    ? Math.round(filteredData.reduce((sum, r) => sum + r.avPot, 0) / filteredData.length)
    : null;

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5 shrink-0">
        <div className="flex items-center gap-2">
          <Satellite className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">위성 전위값 시각화</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Satellite Potential Visualization</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Data preview — public, no auth */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">데이터 소스</Label>
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={onLoadDemoLocal} disabled={isLoading}>
            <Sparkles className="h-4 w-4" />
            데모 데이터 미리보기
          </Button>
          {dataCount > 0 && <p className="text-xs text-muted-foreground">{dataCount}개 전체 / {filteredData.length}개 필터됨</p>}
          {dataCount === 0 && !isLoading && (
            <p className="text-[10px] text-muted-foreground">데이터가 비어있습니다. 데모 데이터를 미리 볼 수 있습니다.</p>
          )}
        </div>

        <Separator />

        {/* View mode */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">뷰 모드</Label>
          <Tabs value={filters.viewMode} onValueChange={(v) => update({ viewMode: v as ViewMode })}>
            <TabsList className="w-full">
              <TabsTrigger value="3D" className="flex-1 gap-1 text-xs"><Globe2 className="h-3 w-3" />3D Globe</TabsTrigger>
              <TabsTrigger value="2D" className="flex-1 gap-1 text-xs"><MapIcon className="h-3 w-3" />2D Map</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="aurora-toggle" className="text-xs flex items-center gap-1 cursor-pointer">
            <Sparkles className="h-3 w-3 text-accent-foreground" /> NOAA OVATION 오로라
          </Label>
          <Switch id="aurora-toggle" checked={filters.showAurora} onCheckedChange={(v) => update({ showAurora: v })} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sat-toggle" className="text-xs flex items-center gap-1 cursor-pointer">
            <Satellite className="h-3 w-3 text-primary" /> 위성 전위 heatmap
          </Label>
          <Switch id="sat-toggle" checked={filters.showSatellite} onCheckedChange={(v) => update({ showSatellite: v })} />
        </div>

        <Separator />

        {/* Day/Night */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">시간 (Day/Night)</Label>
          <Tabs value={filters.timeMode} onValueChange={(v) => update({ timeMode: v as TimeModeUI })}>
            <TabsList className="w-full">
              <TabsTrigger value="AUTO" className="flex-1 gap-1 text-xs"><Clock className="h-3 w-3" />AUTO</TabsTrigger>
              <TabsTrigger value="DAY" className="flex-1 gap-1 text-xs"><Sun className="h-3 w-3" />DAY</TabsTrigger>
              <TabsTrigger value="NGT" className="flex-1 gap-1 text-xs"><Moon className="h-3 w-3" />NGT</TabsTrigger>
            </TabsList>
          </Tabs>
          {filters.timeMode === 'AUTO' && (
            <p className="text-[10px] text-muted-foreground">
              UTC {now.toISOString().slice(11, 16)} · 위치별 자동 결정
            </p>
          )}
        </div>

        <Separator />

        {/* Body Mode */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">바디 구조</Label>
          <RadioGroup value={filters.bodyMode} onValueChange={(v) => update({ bodyMode: v as BodyMode })} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="body-single" />
              <Label htmlFor="body-single" className="cursor-pointer text-xs">Single</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multi" id="body-multi" />
              <Label htmlFor="body-multi" className="cursor-pointer text-xs">Multi</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* FORM */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">구조선택</Label>
          <Select value={filters.form} onValueChange={(v) => update({ form: v as FormType })}>
            <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {FORM_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Node0 Material */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">본체 재질 (Node0)</Label>
          <Select value={filters.node0Material} onValueChange={(v) => update({ node0Material: v as MaterialType })}>
            <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {MATERIAL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isMulti && (
          <>
            <Separator />
            <div className="space-y-1">
              <Label className="text-xs font-semibold">붐 재질 (Node1)</Label>
              <Select value={filters.boomMaterial} onValueChange={(v) => update({ boomMaterial: v as BoomMaterialType })}>
                <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {BOOM_MATERIAL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-semibold">저항</Label>
              <RadioGroup value={filters.resistance} onValueChange={(v) => update({ resistance: v as ResistanceType })} className="flex flex-col gap-1">
                {RESISTANCE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`r-${opt.value}`} />
                    <Label htmlFor={`r-${opt.value}`} className="cursor-pointer text-xs">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </>
        )}

        <Separator />

        {/* Environment Input Parameters — 편집 가능한 드롭다운 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-primary">🌍 환경 파라미터</Label>
          <p className="text-[10px] text-muted-foreground">기본값은 Excel 스펙 · 클릭하여 변경 가능</p>
          <div className="grid grid-cols-2 gap-2">
            {INPUT_PARAM_OPTIONS.map((param) => {
              const values = ENV_PARAM_VALUES[param.key];
              const current = filters[param.key] ?? ENV_FIXED_VALUES[param.key];
              return (
                <div key={param.key} className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">
                    {param.key.toUpperCase()} <span className="opacity-70">[{param.unit}]</span>
                  </div>
                  <Select
                    value={String(current)}
                    onValueChange={(v) => update({ [param.key]: Number(v) } as any)}
                  >
                    <SelectTrigger className="w-full h-7 text-xs font-mono px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {values.map((v) => (
                        <SelectItem key={v} value={String(v)} className="text-xs font-mono">
                          {formatSciNum(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Material Property Parameters — 개별 드롭다운, 고정 옵션 */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-primary">🔬 재질 물성 파라미터</Label>
          {MATERIAL_PROP_OPTIONS.map((param) => {
            const values = MATERIAL_PROP_VALUES[param.key];
            const current = filters[param.key];
            return (
              <div key={param.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {param.label} <span className="text-[10px]">{param.unit}</span>
                </Label>
                <Select
                  value={current !== null ? String(current) : String(values[0])}
                  onValueChange={(v) => update({ [param.key]: Number(v) } as any)}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {values.map((v) => (
                      <SelectItem key={v} value={String(v)}>{formatSciNum(v)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Result */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">📊 결과: 평균 전위 (AvPot)</Label>
          <div className="bg-muted rounded-lg p-3 text-center">
            {currentAvPot !== null ? (
              <div>
                <span className="text-2xl font-bold text-foreground">{formatSciNum(currentAvPot)}</span>
                <span className="text-xs text-muted-foreground ml-1">[V]</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {dataCount > 0 ? '해당 조합에 데이터 없음' : '데이터를 로드해주세요'}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Legend */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">범례 (AvPot)</Label>
          <div className="space-y-1">
            <div className="h-4 rounded" style={{
              background: `linear-gradient(to right, ${legendColors.map(l => l.color).join(', ')})`,
            }} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatSciNum(dataRange.min)}</span>
              <span>Avg Potential [V]</span>
              <span>{formatSciNum(dataRange.max)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border bg-muted/30 shrink-0">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <p>현재 선택:</p>
          <p className="font-medium text-foreground">
            {filters.form} / {filters.node0Material} / {filters.timeMode === 'AUTO' ? 'AUTO ⏱' : filters.timeMode}
          </p>
        </div>
      </div>
    </div>
  );
}
