"use client";

import { Satellite, Sun, Moon, Globe2, Map as MapIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SpisFilter, ViewMode } from "@/lib/spis/types";

interface SpisControlsProps {
  filter: SpisFilter;
  onChange: (f: SpisFilter) => void;
  options: {
    node0: string[];
    node1: string[];
    res: string[];
    node: number[];
    condSolar: string[];
    kp: string[];
  };
  // 미인식 엑셀 컬럼(extras)에서 자동 발견된 필터 옵션: { 원본헤더: 값 목록 }.
  extraOptions: Record<string, (string | number)[]>;
  dayValue: number | null;
  ngtValue: number | null;
  dataCount: number;
  isLoading: boolean;
  onLoadDemoLocal: () => void;
}

const fmt = (v: number | null) =>
  v === null ? "데이터 없음" : `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} V`;

// Radix Select 는 빈 문자열 value 를 허용하지 않으므로 '전체'는 센티널 값으로 표현한다.
const EXTRA_ALL = "__all__";

export function SpisControls({
  filter,
  onChange,
  options,
  extraOptions,
  dayValue,
  ngtValue,
  dataCount,
  isLoading,
  onLoadDemoLocal,
}: SpisControlsProps) {
  const set = (partial: Partial<SpisFilter>) => onChange({ ...filter, ...partial });

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
        {/* 데이터 소스 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">데이터 소스</Label>
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={onLoadDemoLocal}
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4" />
            데모 데이터 미리보기
          </Button>
          <p className="text-xs text-muted-foreground">
            {dataCount > 0 ? `${dataCount}개 데이터 로드됨` : "데이터가 비어있습니다 (데모로 미리보기 가능)"}
          </p>
        </div>

        <Separator />

        {/* 뷰 모드 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">뷰 모드</Label>
          <Tabs value={filter.viewMode} onValueChange={(v) => set({ viewMode: v as ViewMode })}>
            <TabsList className="w-full">
              <TabsTrigger value="3D" className="flex-1 gap-1 text-xs">
                <Globe2 className="h-3 w-3" />3D Globe
              </TabsTrigger>
              <TabsTrigger value="2D" className="flex-1 gap-1 text-xs">
                <MapIcon className="h-3 w-3" />2D Map
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator />

        {/* 태양 조건 (cond_Solar) — 데이터에 값이 있을 때만 표시 */}
        {options.condSolar.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">태양 조건 (Solar)</Label>
            <Select value={filter.condSolar} onValueChange={(v) => set({ condSolar: v })}>
              <SelectTrigger><SelectValue placeholder="태양 조건 선택" /></SelectTrigger>
              <SelectContent>
                {options.condSolar.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 지자기 활동 (Kp) — 데이터에 값이 있을 때만 표시 */}
        {options.kp.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">지자기 활동 (Kp)</Label>
            <Select value={filter.kp} onValueChange={(v) => set({ kp: v })}>
              <SelectTrigger><SelectValue placeholder="Kp 선택" /></SelectTrigger>
              <SelectContent>
                {options.kp.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 자동 발견 파라미터 (extras) — 엑셀의 미인식 컬럼마다 드롭다운 자동 생성 */}
        {Object.entries(extraOptions).map(([key, vals]) => (
          <div key={key} className="space-y-2">
            <Label className="text-xs font-semibold">{key}</Label>
            <Select
              value={filter.extraSel[key] ? filter.extraSel[key] : EXTRA_ALL}
              onValueChange={(v) =>
                set({ extraSel: { ...filter.extraSel, [key]: v === EXTRA_ALL ? "" : v } })
              }
            >
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={EXTRA_ALL}>전체</SelectItem>
                {vals.map((v) => (
                  <SelectItem key={String(v)} value={String(v)}>{String(v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Node0 재질 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Node0 재질</Label>
          <Select value={filter.node0Mat} onValueChange={(v) => set({ node0Mat: v })}>
            <SelectTrigger><SelectValue placeholder="재질 선택" /></SelectTrigger>
            <SelectContent>
              {options.node0.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Node1 (boom) 재질 */}
        {options.node1.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Node1 (Boom) 재질</Label>
            <Select value={filter.node1Mat} onValueChange={(v) => set({ node1Mat: v })}>
              <SelectTrigger><SelectValue placeholder="재질 선택" /></SelectTrigger>
              <SelectContent>
                {options.node1.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 저항 */}
        {options.res.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">저항 (RES)</Label>
            <RadioGroup
              value={filter.res}
              onValueChange={(v) => set({ res: v })}
              className="flex gap-4"
            >
              {options.res.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={`res-${r}`} />
                  <Label htmlFor={`res-${r}`} className="text-sm font-normal cursor-pointer">{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Node */}
        {options.node.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Node</Label>
            <RadioGroup
              value={String(filter.node)}
              onValueChange={(v) => set({ node: Number(v) })}
              className="flex gap-4"
            >
              {options.node.map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <RadioGroupItem value={String(n)} id={`node-${n}`} />
                  <Label htmlFor={`node-${n}`} className="text-sm font-normal cursor-pointer">Node {n}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <Separator />

        {/* 오버레이 토글 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />오로라 표시
            </Label>
            <Switch checked={filter.showAurora} onCheckedChange={(v) => set({ showAurora: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal flex items-center gap-2">
              <Satellite className="h-4 w-4 text-primary" />전위 표시
            </Label>
            <Switch checked={filter.showSatellite} onCheckedChange={(v) => set({ showSatellite: v })} />
          </div>
        </div>

        <Separator />

        {/* 결과: 낮/밤 평균 전위 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">평균 전위 (AvPot)</Label>
          <div className="rounded-lg border border-border overflow-hidden text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-primary/10">
              <span className="flex items-center gap-2"><Sun className="h-4 w-4 text-primary" />DAY (낮)</span>
              <span className="font-mono font-semibold">{fmt(dayValue)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-t border-border">
              <span className="flex items-center gap-2"><Moon className="h-4 w-4" />NGT (밤)</span>
              <span className="font-mono font-semibold">{fmt(ngtValue)}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            지구본의 낮 반구는 DAY 값, 밤 반구는 NGT 값으로 색칠되며 경계는 현재 로컬 타임(태양 직하점) 기준입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
