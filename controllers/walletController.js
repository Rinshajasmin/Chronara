const User = require('../models/usermodel')
const Order = require('../models/orderSchema')
const Wallet = require('../models/walletSchema')
const { v4: uuidv4 } = require('uuid');


// const getWallet = async (req, res) => {
//     try {
//         // Assuming userAuth middleware adds the authenticated user's ID to `req.user`
//         const userId = req.session.user

//         // Find the wallet associated with the authenticated user
//         const wallet = await Wallet.findOne({ userId });

//         if (!wallet) {
//             return res.status(404).json({ message: 'Wallet not found!' });
//         }

//       //res.render('user/table')

//         res.render('user/wallet', { 
//             wallet: {
//                 balance: wallet.balance,
//                 transactions: wallet.transactions.map(tx => ({
//                     id: tx.transactionId,
//                     description: tx.description,
//                     date: tx.date.toISOString(), // Convert date to ISO format
//                     withdrawal: tx.type === 'Withdrawal' ? tx.amount : null,
//                     deposit: tx.type === 'Deposit' ? tx.amount : null,
//                 })),
//             }
//         });    
//         } catch (error) {
//         console.error('Error fetching wallet details:', error);
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

const getWallet = async (req, res) => {
    try {
        const userId = req.session.user;

        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found!' });
        }

        const formattedBalance = parseFloat(wallet.balance).toFixed(2);


        // Sort transactions by date in descending order
        const sortedTransactions = wallet.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(tx => ({
                id: tx.transactionId,
                description: tx.description,
                date: tx.date.toISOString(), // Send as ISO string
                withdrawal: tx.type === 'Withdrawal' ? parseFloat(tx.amount).toFixed(2) : null,
                deposit: tx.type === 'Deposit' ? parseFloat(tx.amount).toFixed(2) : null,
            }));

        res.render('user/wallet', { 
            wallet: {
                balance: formattedBalance,
                transactions: sortedTransactions,
            },
        });
    } catch (error) {
        console.error('Error fetching wallet details:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

  const addMoney = async (req, res) => {
        try {
            const userId = req.session.user;
            const { amount } = req.body;
    
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not logged in.' });
            }
    
            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid amount.' });
            }

            const formattedAmount = parseFloat(amount).toFixed(2);

    
            // Find or create the wallet
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = new Wallet({ userId, balance: 0, transactions: [] });
            }
    
            // Update the wallet balance and add a transaction
            wallet.balance = parseFloat(wallet.balance + parseFloat(formattedAmount)).toFixed(2);
            wallet.transactions.push({
                transactionId: uuidv4(), // Example transaction ID
                description: 'Added money to wallet',
                date: new Date(),
                type: 'Deposit',
                amount:formattedAmount
            });
    
            await wallet.save();
    
            res.json({ success: true, message: 'Money added to wallet successfully.', balance: wallet.balance });
        } catch (error) {
            console.error('Error adding money to wallet:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    };
const getReferrals= async (req, res) => {
        try {
          const userId = req.session.user;
      
          // Fetch referral details
          const wallet = await Wallet.findOne({ userId });
          const totalEarnings = wallet ? wallet.transactions
            .filter(tx => tx.description === 'Referral Bonus')
            .reduce((sum, tx) => sum + tx.amount, 0) : 0;
      
          const user = await User.findById(userId);
          const referees = await User.find({ referredBy: user.referralCode });

          const totalReferredUsers = referees.length;

          referees.sort((a, b) => (b.createdOn || 0) - (a.createdOn || 0));


      
          // Map referees
          const refereeDetails = referees.map(referee => ({
            name: referee.username,
            email: referee.email,
            dateReferred: referee.createdOn ? referee.createdOn.toDateString() : 'N/A', // Handle missing createdAt
        }));
      
          res.render('user/referrals', {
            totalEarnings,
            totalReferredUsers,
            referralCode:user.referralCode,
            referees: refereeDetails,
          });
        } catch (error) {
          console.error("Error fetching referral page:", error);
          res.render('error', { message: "Failed to load referral page" });
        }
      }
      
        


module.exports={getWallet,addMoney,getReferrals}