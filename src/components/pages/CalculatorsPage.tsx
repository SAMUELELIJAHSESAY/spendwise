import { Calculator, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import {
  calculateLoanPayment,
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateROI,
  calculateSavingsTimeline,
  calculateBreakEven,
  calculateEmergencyFund,
} from '../../lib/calculators';

export function CalculatorsPage() {
  const [activeCalculator, setActiveCalculator] = useState<'loan' | 'compound' | 'simple' | 'roi' | 'savings' | 'emergency'>('loan');

  // Loan Calculator
  const [loanForm, setLoanForm] = useState({ principal: '', rate: '', months: '' });
  const [loanResult, setLoanResult] = useState<any>(null);

  const calculateLoan = () => {
    if (loanForm.principal && loanForm.rate && loanForm.months) {
      const result = calculateLoanPayment(
        parseFloat(loanForm.principal),
        parseFloat(loanForm.rate),
        parseInt(loanForm.months)
      );
      setLoanResult(result);
    }
  };

  // Compound Interest Calculator
  const [compoundForm, setCompoundForm] = useState({ principal: '', rate: '', years: '' });
  const [compoundResult, setCompoundResult] = useState<any>(null);

  const calculateCompound = () => {
    if (compoundForm.principal && compoundForm.rate && compoundForm.years) {
      const result = calculateCompoundInterest(
        parseFloat(compoundForm.principal),
        parseFloat(compoundForm.rate),
        parseFloat(compoundForm.years)
      );
      setCompoundResult(result);
    }
  };

  // Simple Interest Calculator
  const [simpleForm, setSimpleForm] = useState({ principal: '', rate: '', years: '' });
  const [simpleResult, setSimpleResult] = useState<any>(null);

  const calculateSimple = () => {
    if (simpleForm.principal && simpleForm.rate && simpleForm.years) {
      const result = calculateSimpleInterest(
        parseFloat(simpleForm.principal),
        parseFloat(simpleForm.rate),
        parseFloat(simpleForm.years)
      );
      setSimpleResult(result);
    }
  };

  // ROI Calculator
  const [roiForm, setRoiForm] = useState({ initial: '', final: '', years: '' });
  const [roiResult, setRoiResult] = useState<any>(null);

  const calculateROIHandler = () => {
    if (roiForm.initial && roiForm.final && roiForm.years) {
      const result = calculateROI(
        parseFloat(roiForm.initial),
        parseFloat(roiForm.final),
        parseFloat(roiForm.years)
      );
      setRoiResult(result);
    }
  };

  // Savings Timeline Calculator
  const [savingsForm, setSavingsForm] = useState({ target: '', current: '', monthly: '' });
  const [savingsResult, setSavingsResult] = useState<any>(null);

  const calculateSavings = () => {
    if (savingsForm.target && savingsForm.monthly) {
      const result = calculateSavingsTimeline(
        parseFloat(savingsForm.target),
        parseFloat(savingsForm.current) || 0,
        parseFloat(savingsForm.monthly)
      );
      setSavingsResult(result);
    }
  };

  // Emergency Fund Calculator
  const [emergencyForm, setEmergencyForm] = useState({ monthlyExpenses: '', months: '3' });
  const [emergencyResult, setEmergencyResult] = useState<any>(null);

  const calculateEmergency = () => {
    if (emergencyForm.monthlyExpenses) {
      const result = calculateEmergencyFund(
        parseFloat(emergencyForm.monthlyExpenses),
        parseInt(emergencyForm.months)
      );
      setEmergencyResult(result);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Calculators</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Calculate loans, interest, ROI, and more</p>
      </div>

      {/* Calculator Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 -mb-4">
        {[
          { id: 'loan', label: 'Loan Calculator' },
          { id: 'compound', label: 'Compound Interest' },
          { id: 'simple', label: 'Simple Interest' },
          { id: 'roi', label: 'ROI Calculator' },
          { id: 'savings', label: 'Savings Timeline' },
          { id: 'emergency', label: 'Emergency Fund' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCalculator(tab.id as any)}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeCalculator === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loan Calculator */}
      {activeCalculator === 'loan' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Loan Payment Calculator</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Loan Amount ($)"
                type="number"
                placeholder="50000"
                value={loanForm.principal}
                onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })}
              />
              <Input
                label="Annual Interest Rate (%)"
                type="number"
                placeholder="5.5"
                step="0.1"
                value={loanForm.rate}
                onChange={(e) => setLoanForm({ ...loanForm, rate: e.target.value })}
              />
              <Input
                label="Loan Term (Months)"
                type="number"
                placeholder="60"
                value={loanForm.months}
                onChange={(e) => setLoanForm({ ...loanForm, months: e.target.value })}
              />
              <Button onClick={calculateLoan} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
            {loanResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${loanResult.monthlyPayment.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Payment</p>
                    <p className="font-bold text-gray-900 dark:text-white">${loanResult.totalPayment.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Interest</p>
                    <p className="font-bold text-gray-900 dark:text-white">${loanResult.totalInterest.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Compound Interest Calculator */}
      {activeCalculator === 'compound' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Compound Interest Calculator</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Principal Amount ($)"
                type="number"
                placeholder="10000"
                value={compoundForm.principal}
                onChange={(e) => setCompoundForm({ ...compoundForm, principal: e.target.value })}
              />
              <Input
                label="Annual Interest Rate (%)"
                type="number"
                placeholder="7"
                step="0.1"
                value={compoundForm.rate}
                onChange={(e) => setCompoundForm({ ...compoundForm, rate: e.target.value })}
              />
              <Input
                label="Time Period (Years)"
                type="number"
                placeholder="5"
                value={compoundForm.years}
                onChange={(e) => setCompoundForm({ ...compoundForm, years: e.target.value })}
              />
              <Button onClick={calculateCompound} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
            {compoundResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${compoundResult.finalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Interest Earned</p>
                    <p className="font-bold text-gray-900 dark:text-white">${compoundResult.interestEarned.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Effective Rate</p>
                    <p className="font-bold text-gray-900 dark:text-white">{compoundResult.effectiveRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Simple Interest Calculator */}
      {activeCalculator === 'simple' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Simple Interest Calculator</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Principal Amount ($)"
                type="number"
                placeholder="5000"
                value={simpleForm.principal}
                onChange={(e) => setSimpleForm({ ...simpleForm, principal: e.target.value })}
              />
              <Input
                label="Annual Interest Rate (%)"
                type="number"
                placeholder="5"
                step="0.1"
                value={simpleForm.rate}
                onChange={(e) => setSimpleForm({ ...simpleForm, rate: e.target.value })}
              />
              <Input
                label="Time Period (Years)"
                type="number"
                placeholder="3"
                value={simpleForm.years}
                onChange={(e) => setSimpleForm({ ...simpleForm, years: e.target.value })}
              />
              <Button onClick={calculateSimple} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
            {simpleResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${simpleResult.finalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Interest Earned</p>
                    <p className="font-bold text-gray-900 dark:text-white">${simpleResult.interestEarned.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Rate</p>
                    <p className="font-bold text-gray-900 dark:text-white">{simpleResult.effectiveRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ROI Calculator */}
      {activeCalculator === 'roi' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Return on Investment (ROI) Calculator</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Initial Investment ($)"
                type="number"
                placeholder="10000"
                value={roiForm.initial}
                onChange={(e) => setRoiForm({ ...roiForm, initial: e.target.value })}
              />
              <Input
                label="Final Value ($)"
                type="number"
                placeholder="15000"
                value={roiForm.final}
                onChange={(e) => setRoiForm({ ...roiForm, final: e.target.value })}
              />
              <Input
                label="Investment Period (Years)"
                type="number"
                placeholder="2"
                value={roiForm.years}
                onChange={(e) => setRoiForm({ ...roiForm, years: e.target.value })}
              />
              <Button onClick={calculateROIHandler} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
            {roiResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {roiResult.roi}%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Gain</p>
                    <p className="font-bold text-gray-900 dark:text-white">${roiResult.gain.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Annual Return</p>
                    <p className="font-bold text-gray-900 dark:text-white">{roiResult.annualReturn}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Savings Timeline Calculator */}
      {activeCalculator === 'savings' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Savings Timeline Calculator</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Target Amount ($)"
                type="number"
                placeholder="5000"
                value={savingsForm.target}
                onChange={(e) => setSavingsForm({ ...savingsForm, target: e.target.value })}
              />
              <Input
                label="Current Savings ($)"
                type="number"
                placeholder="0"
                value={savingsForm.current}
                onChange={(e) => setSavingsForm({ ...savingsForm, current: e.target.value })}
              />
              <Input
                label="Monthly Contribution ($)"
                type="number"
                placeholder="500"
                value={savingsForm.monthly}
                onChange={(e) => setSavingsForm({ ...savingsForm, monthly: e.target.value })}
              />
              <Button onClick={calculateSavings} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
            {savingsResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Target Date</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {savingsResult.targetDate}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Months</p>
                    <p className="font-bold text-gray-900 dark:text-white">{savingsResult.months}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Years</p>
                    <p className="font-bold text-gray-900 dark:text-white">{savingsResult.years}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Emergency Fund Calculator */}
      {activeCalculator === 'emergency' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Emergency Fund Calculator</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Monthly Expenses ($)"
                type="number"
                placeholder="2000"
                value={emergencyForm.monthlyExpenses}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, monthlyExpenses: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Months of Coverage
                </label>
                <select
                  value={emergencyForm.months}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, months: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="3">3 Months (Conservative)</option>
                  <option value="6">6 Months (Recommended)</option>
                  <option value="12">12 Months (Ideal)</option>
                </select>
              </div>
              <Button onClick={calculateEmergency} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
            {emergencyResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Fund Target</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${emergencyResult.amount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    💡 Recommendation
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Save {emergencyResult.percentage} months of your monthly expenses as an emergency fund. This provides a safety net for unexpected expenses.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
