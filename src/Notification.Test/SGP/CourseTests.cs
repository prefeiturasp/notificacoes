using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Notification.Business.SGP;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Tests
{
    [TestClass()]
    public class CourseTests
    {
        [TestMethod()]
        public void CourseGetTest()
        {
            string json = @"[{'Id':61,'Name':'2017 - CIEJA - Educação de Jovens e Adultos'},{'Id':59,'Name':'2017 - EJA - Educação de Jovens e Adultos'},{'Id':59,'Name':'2017 - EJA - Educação de Jovens e Adultos'},{'Id':60,'Name':'2017 - EJA Ensino Fundamental Especial'},{'Id':60,'Name':'2017 - EJA Ensino Fundamental Especial'},{'Id':58,'Name':'2017 - Ensino Fundamental de 9 anos - 10 horas'},{'Id':56,'Name':'2017 - Ensino Fundamental de 9 anos - 4 horas'},{'Id':57,'Name':'2017 - Ensino Fundamental de 9 anos - 5 horas'},{'Id':55,'Name':'2017 - Ensino Fundamental de 9 anos - 7 horas'},{'Id':50,'Name':'2017 - Ensino Fundamental Especial - Diurno'},{'Id':52,'Name':'2017 - Ensino Fundamental Especial - Libras - 5 horas'},{'Id':49,'Name':'2017 - Ensino Fundamental Especial - Noturno'},{'Id':45,'Name':'2017 - Ensino Infantil - 4 horas'},{'Id':46,'Name':'2017 - Ensino Infantil - 5 horas'},{'Id':47,'Name':'2017 - Ensino Infantil - 6 horas'},{'Id':48,'Name':'2017 - Ensino Infantil - 8 horas'},{'Id':51,'Name':'2017 - Ensino Médio'}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<Course>>(json);

            var actual = CourseBusiness.Get("2017");

            IEnumerator<Course> eFixo = expected.GetEnumerator();
            IEnumerator<Course> eBanco = actual.GetEnumerator();

            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }
        }
    }
}