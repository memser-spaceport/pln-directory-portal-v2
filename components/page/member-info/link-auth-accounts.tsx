'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { decodeToken } from '@/utils/auth.utils';

function LinkAuthAccounts() {
  const [userLinkedAccounts, setUserLinkedAccounts] = useState<any>([]);
  const linkAccounts: any[] = [
    { img: '/icons/google.svg', name: 'google', title: 'Google', isLinked: false },
    { img: '/icons/mdi_github.svg', name: 'github', title: 'GitHub', isLinked: false },
    { img: '/icons/wallet-cards.svg', name: 'siwe', title: 'Wallet', isLinked: false },
  ];

  const activeLinkedAccounts: any = linkAccounts.map((account: any) => {
    if (userLinkedAccounts.includes(account?.name)) {
      account.isLinked = true;
    }
    return account;
  });

  const onLinkAccount = (account: any) => {
    document.dispatchEvent(new CustomEvent('auth-link-account', { detail: account }));
  };

  useEffect(() => {
    const rawLinkedAccounts = Cookies.get('authLinkedAccounts');
    if (rawLinkedAccounts) {
      const parsedLinkedAccounts = JSON.parse(rawLinkedAccounts);
      setUserLinkedAccounts(parsedLinkedAccounts.split(','));
    } else {
      setUserLinkedAccounts([]);
    }
    function authAccountsHandler(e: any) {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        const refreshTokenExpiry = decodeToken(JSON.parse(refreshToken));
        Cookies.set('authLinkedAccounts', JSON.stringify(e.detail), {
          expires: new Date(refreshTokenExpiry.exp * 1000),
          path: '/',
          domain: process.env.COOKIE_DOMAIN || '',
        });
        const accounts = e.detail.split(',');
        setUserLinkedAccounts(accounts);
      }
    }

    document.addEventListener('new-auth-accounts', authAccountsHandler);
    return function () {
      document.removeEventListener('new-auth-accounts', authAccountsHandler);
    };
  }, []);

  return (
    <>
      <div className="lc">
        <h2 className="lc__title">Link your account for login</h2>
        <div className="lc__list">
          {activeLinkedAccounts.map((account: any) => (
            <div key={account.name} className="lc__list__item">
              <img width="20" height="20" className="lc__list__item__img" src={account.img} />
              <p className="lc__list__item__title">{account.title}</p>
              {!account.isLinked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onLinkAccount(account.name);
                  }}
                  className="lc__list__item__btn"
                >
                  Link account
                </button>
              )}
              {account.isLinked && (
                <p className="lc__list__item__text">
                  <img src="/icons/tick_green.svg" />
                  <span>Linked</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .lc {
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
            margin: 16px 0;
          }
          .lc__title {
            font-size: 14px;
            font-weight: 600;
          }
          .lc__list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 16px 0;
          }
          .lc__list__item {
            display: flex;
            background: white;
            border-radius: 8px;
            padding: 12px 16px;
          }
          .lc__list__item__img {
          }
          .lc__list__item__title {
            margin: 0 8px;
            font-size: 16px;
            font-weight: 400;
            flex: 1;
          }
          .lc__list__item__btn {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            background: white;
          }
          .lc__list__item__text {
            color: #30c593;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
        `}
      </style>
    </>
  );
}

export default LinkAuthAccounts;
