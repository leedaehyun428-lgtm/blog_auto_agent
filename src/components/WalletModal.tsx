import { useEffect, useMemo, useState } from 'react';
import { Wallet, History, Zap, X, CreditCard, ArrowLeft, Copy } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentVolts: number;
}

type TabType = 'store' | 'history';
type ViewMode = 'list' | 'payment';

interface ChargeItem {
  id: string;
  name: string;
  price: number;
  volts: number;
  bonusLabel: string;
  description: string;
  isBest?: boolean;
}

interface GenerationLog {
  id: number;
  created_at: string;
  keyword: string;
  used_volts: number;
  status: string | null;
}

interface PaymentRequest {
  id: string;
  amount: number;
  bonus_volts: number;
  depositor_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const CHARGE_ITEMS: ChargeItem[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1000,
    volts: 100,
    bonusLabel: '+0%',
    description: '가볍게 체험하기',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    volts: 1100,
    bonusLabel: '+10%',
    description: '가장 인기 있는 선택',
    isBest: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 30000,
    volts: 3500,
    bonusLabel: '+16%',
    description: '대량 작업용',
  },
];

const ACCOUNT_INFO = '카카오뱅크 3333-XX-XXXXXX (예금주: 홍길동)';

const formatDate = (value: string) => {
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
};

const getLogDelta = (item: GenerationLog) => {
  const isCharge =
    item.used_volts < 0 ||
    item.status === 'admin_gift' ||
    item.status === 'admin_charge_approved';
  if (isCharge) return `+${Math.abs(item.used_volts).toLocaleString()}V`;
  if (item.used_volts > 0) return `-${item.used_volts.toLocaleString()}V`;
  return '0V';
};

const getLogDeltaStyle = (item: GenerationLog) => {
  const isCharge =
    item.used_volts < 0 ||
    item.status === 'admin_gift' ||
    item.status === 'admin_charge_approved';
  if (isCharge) return 'text-violet-600';
  if (item.used_volts > 0) return 'text-orange-500';
  return 'text-slate-400';
};

const getPaymentStatusStyle = (status: PaymentRequest['status']) => {
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'approved') return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
};

const getPaymentStatusLabel = (status: PaymentRequest['status']) => {
  if (status === 'pending') return '대기';
  if (status === 'approved') return '승인';
  return '거절';
};

export default function WalletModal({ isOpen, onClose, userId, currentVolts }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<ChargeItem | null>(null);
  const [depositorName, setDepositorName] = useState('');
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLogs = useMemo(() => logs.length > 0, [logs]);
  const hasPaymentRequests = useMemo(() => paymentRequests.length > 0, [paymentRequests]);

  const resetPaymentFlow = () => {
    setViewMode('list');
    setSelectedItem(null);
    setDepositorName('');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetPaymentFlow();
      setActiveTab('store');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'history' || !userId) return;

    let isMounted = true;

    const fetchHistoryData = async () => {
      setIsHistoryLoading(true);

      const [{ data: logData, error: logError }, { data: paymentData, error: paymentError }] = await Promise.all([
        supabase
          .from('generation_logs')
          .select('id, created_at, keyword, used_volts, status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('payment_requests')
          .select('id, amount, bonus_volts, depositor_name, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (!isMounted) return;

      setLogs(logError ? [] : ((logData as GenerationLog[]) || []));
      setPaymentRequests(paymentError ? [] : ((paymentData as PaymentRequest[]) || []));
      setIsHistoryLoading(false);
    };

    fetchHistoryData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, isOpen, userId]);

  const handleCharge = (item: ChargeItem) => {
    setSelectedItem(item);
    setViewMode('payment');
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT_INFO);
      alert('계좌번호가 복사되었습니다.');
    } catch {
      alert('계좌 복사에 실패했습니다.');
    }
  };

  const submitPaymentRequest = async () => {
    if (!selectedItem) return;
    const trimmedName = depositorName.trim();
    if (!trimmedName) {
      alert('입금자명을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('payment_requests').insert({
      user_id: userId,
      amount: selectedItem.price,
      bonus_volts: selectedItem.volts,
      depositor_name: trimmedName,
      status: 'pending',
    });
    setIsSubmitting(false);

    if (error) {
      alert(`신청 실패: ${error.message}`);
      return;
    }

    alert('신청되었습니다! 관리자 확인 후 충전됩니다.');
    resetPaymentFlow();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 p-4">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 md:px-7 md:py-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Wallet className="h-4 w-4" />
                내 지갑 (My Wallet)
              </p>
              <p className="mt-2 flex items-end gap-2 text-slate-900">
                <span className="text-3xl font-black md:text-4xl">{currentVolts.toLocaleString()}</span>
                <span className="pb-1 text-sm font-semibold text-slate-500">V 보유 중</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="지갑 모달 닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 pt-4 md:px-7">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('store')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  activeTab === 'store' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Zap className="h-4 w-4" />
                ⚡ 충전소 (Store)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="h-4 w-4" />
                📄 이용 내역 (History)
              </button>
            </div>
          </div>

          <div className="px-5 pb-6 pt-5 md:px-7 md:pb-7">
            {activeTab === 'store' ? (
              viewMode === 'list' ? (
                <div className="flex flex-col gap-4 md:flex-row">
                  {CHARGE_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex-1 rounded-2xl border bg-white p-5 shadow-sm ${
                        item.isBest ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200'
                      }`}
                    >
                      {item.isBest && (
                        <span className="absolute -top-3 left-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">
                          BEST 추천
                        </span>
                      )}
                      <div className="mb-4 flex items-center gap-2">
                        <CreditCard className={`h-4 w-4 ${item.isBest ? 'text-violet-600' : 'text-slate-500'}`} />
                        <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{item.price.toLocaleString()}원</p>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {item.volts.toLocaleString()}V <span className="text-violet-600">{item.bonusLabel}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      <button
                        type="button"
                        onClick={() => handleCharge(item)}
                        className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
                          item.isBest ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        충전하기
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800 md:text-lg">입금 신청 (Bank Transfer)</h3>
                    <button
                      type="button"
                      onClick={resetPaymentFlow}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      뒤로가기
                    </button>
                  </div>

                  {selectedItem && (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-violet-50 p-4">
                        <p className="text-sm text-slate-700">
                          아래 계좌로{' '}
                          <span className="font-bold text-violet-700">{selectedItem.price.toLocaleString()}원</span>을 입금해 주세요.
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{ACCOUNT_INFO}</p>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          계좌 복사
                        </button>
                      </div>

                      <div>
                        <label htmlFor="depositorName" className="mb-1 block text-sm font-semibold text-slate-700">
                          입금자명 (필수)
                        </label>
                        <input
                          id="depositorName"
                          type="text"
                          value={depositorName}
                          onChange={(event) => setDepositorName(event.target.value)}
                          placeholder="실제 입금자명을 입력해 주세요"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={submitPaymentRequest}
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                      >
                        {isSubmitting ? '신청 중...' : '입금 완료 / 신청하기'}
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:px-5">
                    입금 신청 내역
                  </div>

                  {isHistoryLoading ? (
                    <div className="space-y-3 p-4 md:p-5">
                      {[1, 2, 3].map((row) => (
                        <div key={row} className="animate-pulse rounded-xl border border-slate-100 p-3">
                          <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
                          <div className="mb-2 h-3 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-16 rounded bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  ) : hasPaymentRequests ? (
                    <div className="max-h-[240px] overflow-y-auto p-2 md:p-3">
                      {paymentRequests.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl px-2 py-3 text-sm hover:bg-slate-50 md:px-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-700">
                              {formatDate(item.created_at)} · {item.depositor_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              입금액 ₩{item.amount.toLocaleString()} / 지급 {item.bonus_volts.toLocaleString()}V
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${getPaymentStatusStyle(item.status)}`}
                          >
                            {getPaymentStatusLabel(item.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center">
                      <p className="text-sm font-semibold text-slate-400">입금 신청 내역이 없습니다.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="grid grid-cols-[1.1fr_1fr_auto] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:px-5">
                    <span>날짜</span>
                    <span>내용</span>
                    <span className="text-right">변동량</span>
                  </div>

                  {isHistoryLoading ? (
                    <div className="space-y-3 p-4 md:p-5">
                      {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="animate-pulse rounded-xl border border-slate-100 p-3">
                          <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
                          <div className="mb-2 h-3 w-44 rounded bg-slate-200" />
                          <div className="h-3 w-16 rounded bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  ) : hasLogs ? (
                    <div className="max-h-[280px] overflow-y-auto p-2 md:p-3">
                      {logs.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1.1fr_1fr_auto] items-center gap-2 rounded-xl px-2 py-3 text-sm hover:bg-slate-50 md:px-3"
                        >
                          <p className="font-semibold text-slate-500">{formatDate(item.created_at)}</p>
                          <p className="truncate text-slate-700">{item.keyword || '-'}</p>
                          <p className={`text-right font-bold ${getLogDeltaStyle(item)}`}>{getLogDelta(item)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center">
                      <p className="text-sm font-semibold text-slate-400">사용 내역이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

