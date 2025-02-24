import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './index.css';

function BitgetBTCPrice() {
    const [price, setPrice] = useState(null);
    const [instId, setInstId] = useState('XRP');
    const [investment, setInvestment] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [profitLoss, setProfitLoss] = useState(null);
    const [availableCurrencies, setAvailableCurrencies] = useState([
        'BTC',
        'ETH',
        'XRP',
        'LTC',
        'ADA',
        'SOL',
        'DOT',
        'DOGE',
        'BNB',
        'UNI',
        'LINK',
        'MATIC',
        'AVAX',
        'ATOM',
        'ICP',
        'ALGO',
        'VET'
    ]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Подключение веб-сокета для получения цены
    useEffect(() => {
        let ws;
        const connectWebSocket = (instrument) => {
            if (ws) ws.close();
            ws = new WebSocket('wss://ws.bitget.com/v2/ws/public');
            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        op: 'subscribe',
                        args: [{ instType: 'SPOT', channel: 'ticker', instId: `${instrument}USDT` }],
                    })
                );
            };
            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.action === 'snapshot' && response.data?.length) {
                    setPrice(Number(response.data[0].lastPr));
                }
            };
            setTimeout(() => ws.close(), 30000);
        };

        connectWebSocket(instId);
        return () => ws && ws.close();
    }, [instId]);

    // Расчёт количества монет
    useEffect(() => {
        const invest = Number(investment);
        const pricePerUnit = Number(purchasePrice);
        if (!isNaN(invest) && !isNaN(pricePerUnit) && invest > 0 && pricePerUnit > 0) {
            setQuantity(invest / pricePerUnit);
        } else {
            setQuantity(0);
        }
    }, [investment, purchasePrice]);

    // Расчёт прибыли/убытка
    useEffect(() => {
        if (price !== null && quantity > 0) {
            setProfitLoss((price - Number(purchasePrice)) * quantity);
        } else {
            setProfitLoss(null);
        }
    }, [price, quantity, purchasePrice]);

    // Сохранение транзакции в cookie
    const saveToLocalStorage = () => {
        const newTransaction = {
            currency: instId,
            purchasePrice: Number(purchasePrice),
            quantity: quantity,
        };
        const existingTransactions = Cookies.get('transactions')
            ? JSON.parse(Cookies.get('transactions'))
            : [];
        Cookies.set(
            'transactions',
            JSON.stringify([...existingTransactions, newTransaction]),
            { expires: 7 }
        );
    };

    // Закрытие выпадающего списка при клике вне его
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Фильтрация валют по введённому значению (без учёта регистра)
    const filteredCurrencies = availableCurrencies.filter(currency =>
        currency.toUpperCase().includes(instId.toUpperCase())
    );

    // Опция "Добавить" показывается, если введённого токена нет в списке (точное совпадение)
    const shouldShowAddOption =
        instId &&
        !availableCurrencies.some(
            currency => currency.toUpperCase() === instId.toUpperCase()
        );

    // Выбор валюты из списка
    const handleSelectCurrency = (currency) => {
        setInstId(currency);
        setShowDropdown(false);
    };

    // Добавление новой валюты
    const handleAddCurrency = () => {
        if (instId && shouldShowAddOption) {
            setAvailableCurrencies([...availableCurrencies, instId]);
            setShowDropdown(false);
        }
    };

    // Удаление валюты из списка
    const handleRemoveCurrency = (currency) => {
        setAvailableCurrencies(availableCurrencies.filter(c => c !== currency));
        if (instId.toUpperCase() === currency.toUpperCase()) {
            const remaining = availableCurrencies.filter(c => c.toUpperCase() !== currency.toUpperCase());
            setInstId(remaining.length > 0 ? remaining[0] : '');
        }
    };

    return (
        <div className="container">
            <h1 className="color-gray">Курс {instId}/USDT</h1>
            <p className="price">
                {price !== null ? `${price.toFixed(4)} USDT` : 'Загрузка...'}
            </p>

            <div className="crypto-select" ref={dropdownRef} style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="input"
                    value={instId}
                    onChange={(e) => setInstId(e.target.value.toUpperCase())}
                    onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && (
                    <div
                        className="dropdown"
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: '#fff',
                            border: '1px solid #ccc',
                        }}
                    >
                        {shouldShowAddOption && (
                            <div
                                className="dropdown-item add-option"
                                onMouseDown={handleAddCurrency}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    background: '#f0f0f0',
                                }}
                            >
                                Добавить {instId}
                            </div>
                        )}
                        {filteredCurrencies.map((currency, index) => (
                            <div
                                key={index}
                                className="dropdown-item"
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                onMouseDown={() => handleSelectCurrency(currency)}
                            >
                                <span>{currency}</span>
                                <button
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleRemoveCurrency(currency);
                                    }}
                                    style={{
                                        marginLeft: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="purchase-section">
                <h2 className="color-gray">Ваши инвестиции</h2>
                <label className="color-gray">Сумма (USDT):</label>
                <input
                    type="number"
                    className="input"
                    step="0.01"
                    value={investment}
                    onChange={(e) => setInvestment(e.target.value)}
                />
                <label className="color-gray">
                    Цена покупки (USDT за 1 {instId}):
                </label>
                <input
                    type="number"
                    className="input"
                    step="0.0001"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                />
                <h3 className="color-gray">
                    Куплено {instId}:{' '}
                    <span className="quantity">{quantity.toFixed(4)}</span>
                </h3>
            </div>

            {profitLoss !== null && (
                <div className="result">
                    <h2 className="color-gray">Результат</h2>
                    <p className={`profit-loss ${profitLoss > 0 ? 'profit' : 'loss'}`}>
                        {profitLoss > 0 ? 'Прибыль' : 'Убыток'}: {Math.abs(profitLoss).toFixed(4)} USDT
                    </p>
                </div>
            )}
            <div>
                <button className="save-button" onClick={saveToLocalStorage}>
                    Сохранить в портфель
                </button>
                <button className="save-button" onClick={() => navigate('/table')}>
                    Перейти к таблице
                </button>
            </div>
        </div>
    );
}

export default BitgetBTCPrice;
