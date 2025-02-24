import React, { useEffect, useState, useRef } from 'react';
import './index.css';
function TableRow({ transaction, onRemove }) {
    const [livePrice, setLivePrice] = useState(null);
    const [profitLoss, setProfitLoss] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        wsRef.current = new WebSocket('wss://ws.bitget.com/v2/ws/public');

        wsRef.current.onopen = () => {
            wsRef.current.send(JSON.stringify({
                op: 'subscribe',
                args: [{ instType: 'SPOT', channel: 'ticker', instId: `${transaction.currency}USDT` }]
            }));
        };

        wsRef.current.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.action === 'snapshot' && response.data?.length) {
                const newPrice = Number(response.data[0].lastPr);
                setLivePrice(newPrice);
            }
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [transaction.currency]);

    useEffect(() => {
        if (!isNaN(livePrice) && !isNaN(transaction.quantity) && transaction.quantity > 0) {
            const newProfitLoss = (livePrice * transaction.quantity) - (transaction.purchasePrice * transaction.quantity);
            setProfitLoss(newProfitLoss);
        } else {
            setProfitLoss(null);
        }
    }, [livePrice, transaction.quantity, transaction.purchasePrice]);

    return (
        <tr className={`table-row ${profitLoss !== null && profitLoss >= 0 ? 'profit' : 'loss'}`}>
            <td data-label="Валюта">{transaction.currency}</td>
            <td data-label="Текущая цена">{livePrice !== null ? livePrice.toFixed(4) : '—'}</td>
            <td data-label="Цена покупки">{transaction.purchasePrice.toFixed(2)} USDT</td>
            <td data-label="Количество">{transaction.quantity.toFixed(3)}</td>
            <td data-label="Прибыль/Убыток">{profitLoss !== null ? (profitLoss >= 0 ? `+${profitLoss.toFixed(2)}` : profitLoss.toFixed(2)) : '—'} USDT</td>
            <td>
                <button className="remove-button" onClick={onRemove}>Удалить</button>
            </td>
        </tr>
    );
}

export default TableRow;