import React, { useEffect, useState } from 'react';

function BitgetBTCPrice() {
    const [price, setPrice] = useState(null);
    const [instId, setInstId] = useState('XRP'); // Начальное значение инструмента
    const [socket, setSocket] = useState(null);

    // Поля для ввода
    const [investment, setInvestment] = useState(''); // Сумма в USDT
    const [purchasePrice, setPurchasePrice] = useState(''); // Цена покупки 1 монеты
    const [quantity, setQuantity] = useState(0); // Автоматически вычисляется
    const [profitLoss, setProfitLoss] = useState(null); // Динамический расчет прибыли/убытка

    useEffect(() => {
        let ws;

        const connectWebSocket = (instrument) => {
            if (ws) {
                ws.close();
            }

            ws = new WebSocket('wss://ws.bitget.com/v2/ws/public');

            ws.onopen = () => {
                console.log('WebSocket подключен');

                const subscribeMessage = JSON.stringify({
                    op: 'subscribe',
                    args: [
                        {
                            instType: 'SPOT',
                            channel: 'ticker',
                            instId: `${instrument}USDT`
                        }
                    ]
                });
                ws.send(subscribeMessage);
            };

            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.action === 'snapshot' && response.data && response.data.length > 0) {
                    const btcData = response.data[0];
                    setPrice(Number(btcData.lastPr)); // Убедимся, что цена - число
                }
            };

            ws.onclose = () => {
                console.log('WebSocket соединение закрыто');
            };

            ws.onerror = (error) => {
                console.error('Ошибка WebSocket:', error);
            };

            setSocket(ws);
        };

        connectWebSocket(instId);

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [instId]);

    // Автоматический расчет количества криптовалюты
    useEffect(() => {
        const investmentValue = Number(investment);
        const purchasePriceValue = Number(purchasePrice);

        if (!isNaN(investmentValue) && !isNaN(purchasePriceValue) && investmentValue > 0 && purchasePriceValue > 0) {
            setQuantity(investmentValue / purchasePriceValue);
        } else {
            setQuantity(0);
        }
    }, [investment, purchasePrice]);

    // Автоматический расчет прибыли/убытка
    useEffect(() => {
        if (price !== null && quantity > 0) {
            const profitOrLoss = (price - Number(purchasePrice)) * quantity;
            setProfitLoss(profitOrLoss);
        } else {
            setProfitLoss(null);
        }
    }, [price, quantity, purchasePrice]);

    return (
        <div>
            <h1>Текущая цена {instId}/USDT</h1>
            {price !== null ? <p>{price.toFixed(4)} USDT</p> : <p>Загрузка...</p>}

            <div>
                <label>Выберите криптовалюту:</label>
                <input
                    type="text"
                    value={instId}
                    onChange={(e) => setInstId(e.target.value.toUpperCase())}
                />
                <button onClick={() => setInstId(instId)}>Обновить</button>
            </div>

            <div>
                <h2>Введите данные о покупке</h2>
                <label>
                    Сумма покупки (USDT):
                    <input
                        type="number"
                        step="0.01"
                        value={investment}
                        onChange={(e) => setInvestment(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Цена покупки (USDT за 1 {instId}):
                    <input
                        type="number"
                        step="0.0001"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                    />
                </label>
                <br />
                <h3>Количество купленных {instId}: {quantity.toFixed(4)}</h3>
            </div>

            {profitLoss !== null && (
                <div>
                    <h2>Текущий результат</h2>
                    <p style={{ color: profitLoss > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                        {profitLoss > 0 ? 'Прибыль' : 'Убыток'}: {Math.abs(profitLoss).toFixed(4)} USDT
                    </p>
                </div>
            )}
        </div>
    );
}

export default BitgetBTCPrice;
