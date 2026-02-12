import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { analyzeKeyword, buildBasicContext, generateBlogPost, searchInfo } from '../api';
import type { ThemeType } from '../api';
import { supabase } from '../supabaseClient';

interface AnalysisItem {
  keyword: string;
  totalSearch: number;
  totalClick: string;
  compIdx: string;
}

interface AnalysisData {
  main: AnalysisItem;
  recommendations: AnalysisItem[];
}

interface ExposureGuide {
  charCount: number;
  imgCount: number;
  keywordCount: number;
}

interface UseGenerationParams {
  user: User | null;
  keyword: string;
  setKeywordError: (value: string) => void;
  mode: 'basic' | 'pro';
  selectedTheme: ThemeType;
  useGuide: boolean;
  guide: string;
  volts: number;
  handleLogin: () => void;
  requestConfirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }) => Promise<boolean>;
  saveToHistory: (keyword: string, content: string, toneGuide?: string) => Promise<void>;
  setVolts: Dispatch<SetStateAction<number>>;
  setIsLoading: (value: boolean) => void;
  setResult: (value: string) => void;
  setCopyStatus: (value: string) => void;
  setStep: (value: 'idle' | 'searching' | 'writing' | 'done') => void;
  setResultMode: (value: 'basic' | 'pro') => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalysisData: Dispatch<SetStateAction<AnalysisData | null>>;
  setExposureGuide: Dispatch<SetStateAction<ExposureGuide | null>>;
  setKeyword: (value: string) => void;
  setIsMobileView: (value: boolean) => void;
  setIsEditing: (value: boolean) => void;
  setGuide: (value: string) => void;
  setUseGuide: (value: boolean) => void;
  setSelectedPromptId: (value: string) => void;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const PAYMENT_ERROR = '볼트가 부족하거나 결제 중 오류가 발생했습니다. 충전이 필요할 수 있습니다.';
const GENERATION_TIMEOUT_MS = 60000;
const GENERATION_TIMEOUT_ERROR = '생성 요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.';
const MODE_COST: Record<'basic' | 'pro', number> = {
  basic: 20,
  pro: 100,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류';
}

function getDetailedError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const response = record.response as Record<string, unknown> | undefined;
    const data = response?.data as Record<string, unknown> | undefined;
    const innerError = data?.error as Record<string, unknown> | undefined;
    const message = innerError?.message;
    if (typeof message === 'string') return message;
  }
  return getErrorMessage(error);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function useGeneration({
  user,
  keyword,
  setKeywordError,
  mode,
  selectedTheme,
  useGuide,
  guide,
  volts,
  handleLogin,
  requestConfirm,
  saveToHistory,
  setVolts,
  setIsLoading,
  setResult,
  setCopyStatus,
  setStep,
  setResultMode,
  setIsAnalyzing,
  setAnalysisData,
  setExposureGuide,
  setKeyword,
  setIsMobileView,
  setIsEditing,
  setGuide,
  setUseGuide,
  setSelectedPromptId,
  notify,
}: UseGenerationParams) {
  const handleAnalyze = async () => {
    if (!user) {
      const shouldLogin = await requestConfirm({
        title: '로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인하고 무료로 분석해볼까요?',
        confirmText: '로그인',
        cancelText: '취소',
      });
      if (shouldLogin) handleLogin();
      return;
    }
    if (!keyword.trim()) {
      setKeywordError('키워드를 입력해주세요.');
      return;
    }
    setKeywordError('');

    setIsAnalyzing(true);
    setAnalysisData(null);
    setExposureGuide(null);

    try {
      const keywordData = await analyzeKeyword(keyword);
      setAnalysisData(keywordData as AnalysisData);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const guideData = await response.json();

      setExposureGuide({
        charCount: guideData.averageCharCount,
        imgCount: guideData.averageImageCount,
        keywordCount: guideData.keywordCount,
      });
    } catch {
      notify('error', '분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cost = MODE_COST[mode];

  const handleGenerate = async () => {
    if (!user) {
      const shouldLogin = await requestConfirm({
        title: '로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인하고 서비스를 이용해볼까요?',
        confirmText: '로그인',
        cancelText: '취소',
      });
      if (shouldLogin) handleLogin();
      return;
    }

    if (!keyword.trim()) {
      setKeywordError('키워드를 입력해주세요.');
      return;
    }
    setKeywordError('');
    const shouldProceed = await requestConfirm({
      title: '볼트 차감 확인',
      message: `⚡ ${cost} 볼트가 차감됩니다.\n모드: ${mode === 'pro' ? '고성능 모드' : '일반 모드'}\n(현재 잔액: ${volts} V)\n\n진행하시겠습니까?`,
      confirmText: '진행',
      cancelText: '취소',
    });
    if (!shouldProceed) return;

    setIsLoading(true);
    setResult('');
    setCopyStatus('idle');
    let isVoltsDeducted = false;

    try {
      const { data: isSuccess, error: payError } = await supabase
        .rpc('deduct_volts', { row_id: user.id, amount: cost });

      if (payError || !isSuccess) {
        throw new Error(PAYMENT_ERROR);
      }

      isVoltsDeducted = true;
      setVolts((prev) => prev - cost);

      let searchData = '';
      if (mode === 'pro') {
        setStep('searching');
        searchData = await withTimeout(
          searchInfo(keyword, mode, selectedTheme),
          GENERATION_TIMEOUT_MS,
          GENERATION_TIMEOUT_ERROR,
        );
      } else {
        searchData = buildBasicContext(keyword, selectedTheme);
      }

      setStep('writing');
      const blogPost = await withTimeout(
        generateBlogPost(
          keyword,
          searchData,
          selectedTheme,
          useGuide ? guide : undefined,
        ),
        GENERATION_TIMEOUT_MS,
        GENERATION_TIMEOUT_ERROR,
      );

      setResult(blogPost);
      setResultMode(mode);
      setStep('done');
      await saveToHistory(keyword, blogPost, useGuide ? guide : undefined);

      await supabase.from('generation_logs').insert({
        user_id: user.id,
        keyword,
        theme: selectedTheme,
        used_volts: cost,
        status: 'success',
        error_message: `mode=${mode}; path=${mode === 'pro' ? 'perplexity+gemini' : 'gemini-only'}`,
      });
    } catch (error: unknown) {
      console.error(error);
      const message = getErrorMessage(error);
      const detailedError = getDetailedError(error);

      if (message !== PAYMENT_ERROR && isVoltsDeducted) {
        const { data: refundSuccess, error: refundError } = await supabase
          .rpc('refund_volts', { row_id: user.id, amount: cost });

        if (!refundError && refundSuccess) {
          setVolts((prev) => prev + cost);

          await supabase.from('generation_logs').insert({
            user_id: user.id,
            keyword: '환불 완료(자동)',
            theme: selectedTheme,
            status: 'refunded',
            used_volts: cost,
            error_message: detailedError,
          });

          notify('error', '생성 중 오류가 발생하여 볼트가 자동 환불되었습니다. 다시 시도해 주세요.');
        } else {
          console.error('자동 환불 실패:', refundError);
          notify('error', '생성 중 오류가 발생했고 환불 처리에 실패했습니다. 관리자에게 문의해 주세요.');
        }
      } else {
        notify('error', message);
      }

      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToHome = () => {
    setStep('idle');
    setKeyword('');
    setResult('');
    setAnalysisData(null);
    setIsMobileView(false);
    setIsEditing(false);
    setGuide('');
    setUseGuide(false);
    setSelectedPromptId('');
    setKeywordError('');
  };

  return {
    handleAnalyze,
    handleGenerate,
    resetToHome,
  };
}
