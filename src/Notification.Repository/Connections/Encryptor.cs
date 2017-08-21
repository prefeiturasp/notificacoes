using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Repository.Connections
{
    public class Encryptor
    {
        private static byte[] tdesKey = new byte[] { 107, 8, 82, 60, 113, 135, 190, 128, 188, 51, 238, 120, 59, 135, 57, 140, 107, 8, 82, 60, 113, 135, 190, 128 };
        private static byte[] tdesIV = new byte[] { 113, 135, 190, 128, 186, 217, 34, 47 };

        public static string EncryptTripleDES(string senha)
        {
            byte[] plainByte = ASCIIEncoding.ASCII.GetBytes(senha);
            MemoryStream ms = new MemoryStream();
            SymmetricAlgorithm sym = TripleDES.Create();
            CryptoStream encStream = new CryptoStream(ms, sym.CreateEncryptor(tdesKey, tdesIV), CryptoStreamMode.Write);
            encStream.Write(plainByte, 0, plainByte.Length);
            encStream.FlushFinalBlock();
            byte[] cryptoByte = ms.ToArray();
            return Convert.ToBase64String(cryptoByte);
        }

        public static string DecryptTripleDES(string senha)
        {
            byte[] cryptoByte = Convert.FromBase64String(senha);
            var sym = TripleDES.Create();
            MemoryStream ms = new MemoryStream(cryptoByte, 0, cryptoByte.Length);
            CryptoStream cs = new CryptoStream(ms, sym.CreateDecryptor(tdesKey, tdesIV), CryptoStreamMode.Read);
            var ret = _ReadBytes(cs);
            return ASCIIEncoding.ASCII.GetString(ret);
        }

        private static byte[] _ReadBytes(Stream s)
        {
            int length = 10000000;
            byte[] buffer = new byte[length];
            int bytesLidos = length;
            using (MemoryStream ms = new MemoryStream())
            {
                while (bytesLidos == length)
                {
                    bytesLidos = s.Read(buffer, 0, length);
                    ms.Write(buffer, 0, bytesLidos);
                }

                return ms.ToArray();
            }
        }
    }
}
