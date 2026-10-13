const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, List } = require('../models');
const sendEmail = require('../utils/emailService');
const crypto = require('crypto');


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n${resetUrl}`;

    await sendEmail(user.email, 'Şifre Sıfırlama Talebi', message);

    res.json({ message: 'Sıfırlama bağlantısı e-posta adresinize gönderildi.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hata oluştu' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }

    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hata oluştu' });
  }
};

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
  }

  try {
    
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta zaten kullanımda.' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    
    const defaultLists = ['İzlediklerim', 'İzlenecekler', 'Okuduklarım', 'Okunacaklar'];
    for (const listName of defaultLists) {
        await List.create({
            name: listName,
            UserId: user.id
        });
    }

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id)
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı verisi.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ message: 'Kullanıcı bilgileri' });
};
